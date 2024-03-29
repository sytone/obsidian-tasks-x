import type { Moment } from 'moment';
import { Component, MarkdownRenderer, TFile } from 'obsidian';
import moment from 'moment';

import { StatusRegistry } from './StatusRegistry';
import { Status } from './Status';
import { replaceTaskWithTasks } from './File';
import { LayoutOptions } from './LayoutOptions';
import { Recurrence, RecurrenceRecord } from './Recurrence';
import { getGeneralSetting, getSettings, isFeatureEnabled } from './Config/Settings';
import { Urgency } from './Urgency';
import { CreatedDateProperty } from './TaskProperties';
import TasksServices from './TasksServices';

/**
 * When sorting, make sure low always comes after none. This way any tasks with low will be below any exiting
 * tasks that have no priority which would be the default.
 *
 * @export
 * @enum {number}
 */
export enum Priority {
    High = '1',
    Medium = '2',
    None = '3',
    Low = '4',
}

export type TaskRecord = {
    status: Status;
    description: string;
    path: string;
    file: TFile | null;
    indentation: string;
    sectionStart: number;
    sectionIndex: number;
    precedingHeader: string | null;
    priority: Priority;
    startDate: Date | null;
    scheduledDate: Date | null;
    dueDate: Date | null;
    createdDate: Date | null;
    doneDate: Date | null;
    recurrence: RecurrenceRecord | null;
    blockLink: string;
    tags: string[] | [];
    originalMarkdown: string;
};

export class TaskRegularExpressions {
    public static readonly dateFormat = 'YYYY-MM-DD';

    // Main regex for parsing a line. It matches the following:
    // - Indentation
    // - Status character
    // - Rest of task after checkbox markdown
    public static readonly taskRegex = /^([\s\t]*)[-*] +\[(.)\] *(.*)/u;

    // Match on block link at end.
    public static readonly blockLinkRegex = / \^[a-zA-Z0-9-]+$/u;

    // The following regex's end with `$` because they will be matched and
    // removed from the end until none are left.
    public static readonly priorityRegex = /([⏫🔼🔽])$/u;
    public static readonly startDateRegex = /🛫 ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly scheduledDateRegex = /[⏳⌛] ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly dueDateRegex = /[📅📆🗓] ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly doneDateRegex = /✅ ?(\d{4}-\d{2}-\d{2})$/u;
    public static readonly recurrenceRegex = /🔁 ?([a-zA-Z0-9, !]+)$/iu;

    // Regex to match all hash tags, basically hash followed by anything but the characters in the negation.
    // To ensure URLs are not caught it is looking of beginning of string tag and any
    // tag that has a space in front of it. Any # that has a character in front
    // of it will be ignored.
    // EXAMPLE:
    // description: '#dog #car http://www/ddd#ere #house'
    // matches: #dog, #car, #house
    public static readonly hashTags = /(^|\s)#[^ !@#$%^&*(),.?":{}|<>]*/g;
}

/**
 * Task encapsulates the properties of the MarkDown task along with
 * the extensions provided by this plugin. This is used to parse and
 * generate the markdown task for all updates and replacements.
 *
 * @export
 * @class Task
 */
export class Task {
    public readonly status: Status;
    public readonly description: string;
    public readonly path: string;
    public readonly file: TFile | null;

    public readonly indentation: string;
    /** Line number where the section starts that contains this task. */
    public readonly sectionStart: number;
    /** The index of the nth task in its section. */
    public readonly sectionIndex: number;
    public readonly precedingHeader: string | null;

    public readonly tags: string[];

    public readonly priority: Priority;

    public readonly startDate: Moment | null;
    public readonly scheduledDate: Moment | null;
    public readonly dueDate: Moment | null;
    public readonly doneDate: Moment | null;
    public readonly createdDate: CreatedDateProperty | null;

    public readonly recurrence: Recurrence | null;
    /** The blockLink is a "^" annotation after the dates/recurrence rules. */
    public readonly blockLink: string;

    public readonly originalMarkdown: string;

    private _urgency: number | null = null;

    constructor({
        status,
        description,
        path,
        file,
        indentation,
        sectionStart,
        sectionIndex,
        precedingHeader,
        priority,
        startDate,
        scheduledDate,
        dueDate,
        doneDate,
        createdDate,
        recurrence,
        blockLink,
        tags,
        originalMarkdown,
    }: {
        status: Status;
        description: string;
        path: string;
        file: TFile | null;
        indentation: string;
        sectionStart: number;
        sectionIndex: number;
        precedingHeader: string | null;
        priority: Priority;
        startDate: moment.Moment | null;
        scheduledDate: moment.Moment | null;
        dueDate: moment.Moment | null;
        doneDate: moment.Moment | null;
        createdDate: CreatedDateProperty | null;
        recurrence: Recurrence | null;
        blockLink: string;
        tags: string[] | [];
        originalMarkdown: string;
    }) {
        this.status = status === undefined ? Status.TODO : status;
        this.description = description === undefined ? '' : description;
        this.path = path === undefined ? '' : path;
        this.file = file;
        this.indentation = indentation === undefined ? '' : indentation;
        this.sectionStart = sectionStart;
        this.sectionIndex = sectionIndex;
        this.precedingHeader = precedingHeader === undefined ? '' : precedingHeader;

        this.tags = tags;

        this.priority = priority;

        this.startDate = startDate;
        this.scheduledDate = scheduledDate;
        this.dueDate = dueDate;
        this.doneDate = doneDate;
        this.createdDate = createdDate;

        this.recurrence = recurrence;
        this.blockLink = blockLink;
        this.originalMarkdown = originalMarkdown;
    }

    public get urgency(): number {
        if (this._urgency === null) {
            this._urgency = Urgency.calculate(this);
        }

        return this._urgency;
    }

    public get filename(): string | null {
        const fileNameMatch = this.path.match(/([^/]+)\.md$/);
        if (fileNameMatch !== null) {
            return fileNameMatch[1];
        } else {
            return null;
        }
    }

    public get created(): moment.Moment | null {
        if (this.createdDate?.value) {
            return this.createdDate.value;
        }
        return null;
    }

    /**
     * Returns the page back link for this task including
     * the header is available.
     *
     * @readonly
     * @type {string}
     * @memberof Task
     */
    public get backlinkHref(): string {
        let linkHref = this.path;
        if (this.precedingHeader !== null) {
            linkHref = linkHref + '#' + this.precedingHeader;
        }
        return linkHref;
    }

    private _isFilenameUnique: boolean | undefined = undefined;

    public get isFilenameUnique(): boolean | undefined {
        if (this.path === '' || this.path === undefined) {
            return undefined;
        }

        // Will match the filename without extension (the file's "basename").
        const filenameMatch = this.path.match(/([^/]*)\..+$/i);
        if (filenameMatch === null) {
            return undefined;
        }

        if (this._isFilenameUnique !== undefined) {
            return this._isFilenameUnique;
        }

        const filename = filenameMatch[1];

        // If this is not set we are out of Obsidian, so return true by default.
        if (TasksServices.obsidianApp === undefined) {
            return true;
        }
        const allFilesWithSameName = TasksServices.obsidianApp.vault.getMarkdownFiles().filter((file: TFile) => {
            if (file.basename === filename) {
                // Found a file with the same name (it might actually be the same file, but we'll take that into account later.)
                this._isFilenameUnique = true;
                return this._isFilenameUnique;
            }
        });

        this._isFilenameUnique = allFilesWithSameName.length < 2;
        return this._isFilenameUnique;
    }

    static fromTaskRecord(record: TaskRecord): Task {
        return new Task({
            status: record.status,
            description: record.description,
            path: record.path,
            file: record.file,
            indentation: record.indentation,
            sectionStart: record.sectionStart,
            sectionIndex: record.sectionIndex,
            precedingHeader: record.precedingHeader,
            priority: record.priority,
            startDate: record.startDate !== null ? moment(record.startDate) : null,
            scheduledDate: record.scheduledDate !== null ? moment(record.scheduledDate) : null,
            dueDate: record.dueDate !== null ? moment(record.dueDate) : null,
            doneDate: record.doneDate !== null ? moment(record.doneDate) : null,
            createdDate: record.createdDate !== null ? new CreatedDateProperty(record.createdDate) : null,
            recurrence: record.recurrence ? Recurrence.fromRecurrenceRecord(record.recurrence) : null,
            blockLink: record.blockLink,
            tags: record.tags,
            originalMarkdown: record.originalMarkdown,
        });
    }

    /**
     * Takes the given line from a obsidian note and returns a Task object.
     *
     * @static
     * @param {string} line - The full line in the note to parse.
     * @param {string} path - Path to the note in obsidian.
     * @param {number} sectionStart - Line number where the section starts that contains this task.
     * @param {number} sectionIndex - The index of the nth task in its section.
     * @param {(string | null)} precedingHeader - The header before this task.
     * @return {*}  {(Task | null)}
     * @memberof Task
     */

    public static fromLine({
        line,
        path,
        file,
        sectionStart,
        sectionIndex,
        precedingHeader,
    }: {
        line: string;
        path: string;
        file: TFile | null;
        sectionStart: number;
        sectionIndex: number;
        precedingHeader: string | null;
    }): Task | null {
        // Check the line to see if it is a markdown task.
        const regexMatch = line.match(TaskRegularExpressions.taskRegex);
        if (regexMatch === null) {
            return null;
        }

        // match[3] includes the whole body of the task after the brackets.
        const body = regexMatch[3].trim();

        // return if task does not have the global filter. Do this before processing
        // rest of match to improve performance.
        const { globalFilter } = getSettings();
        if (!body.includes(globalFilter)) {
            return null;
        }

        // Global filter is applied via edit or to string and no
        // longer needs to be on the description. If this happens
        // there may be a double space. So all double spaces are made
        // single like the UI processing.
        let description = body.replace(globalFilter, '').replace('  ', ' ').trim();
        const indentation = regexMatch[1];

        // Get the status of the task.
        const statusString = regexMatch[2].toLowerCase();
        const status = StatusRegistry.getInstance().byIndicator(statusString);
        if (status === null) {
            throw new Error(`Missing status indicator: ${statusString}`);
        }

        // Match for block link and remove if found. Always expected to be
        // at the end of the line.
        const blockLinkMatch = description.match(TaskRegularExpressions.blockLinkRegex);
        const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';

        if (blockLink !== '') {
            description = description.replace(TaskRegularExpressions.blockLinkRegex, '').trim();
        }

        // New process of parsing the task, used by created date.

        const createdDate = new CreatedDateProperty(description);
        description = description.replace(createdDate.toMarkdownString(), '').trim();

        // Keep matching and removing special strings from the end of the
        // description in any order. The loop should only run once if the
        // strings are in the expected order after the description.
        let matched: boolean;
        let priority: Priority = Priority.None;
        let startDate: Moment | null = null;
        let scheduledDate: Moment | null = null;
        let dueDate: Moment | null = null;
        let doneDate: Moment | null = null;
        let recurrence: Recurrence | null = null;
        let tags: any = [];
        // Add a "max runs" failsafe to never end in an endless loop:
        const maxRuns = 7;
        let runs = 0;
        do {
            matched = false;
            const priorityMatch = description.match(TaskRegularExpressions.priorityRegex);
            if (priorityMatch !== null) {
                switch (priorityMatch[1]) {
                    case '🔽':
                        priority = Priority.Low;
                        break;
                    case '🔼':
                        priority = Priority.Medium;
                        break;
                    case '⏫':
                        priority = Priority.High;
                        break;
                }

                description = description.replace(TaskRegularExpressions.priorityRegex, '').trim();
                matched = true;
            }

            const doneDateMatch = description.match(TaskRegularExpressions.doneDateRegex);
            if (doneDateMatch !== null) {
                doneDate = window.moment(doneDateMatch[1], TaskRegularExpressions.dateFormat);
                description = description.replace(TaskRegularExpressions.doneDateRegex, '').trim();
                matched = true;
            }

            const dueDateMatch = description.match(TaskRegularExpressions.dueDateRegex);
            if (dueDateMatch !== null) {
                dueDate = window.moment(dueDateMatch[1], TaskRegularExpressions.dateFormat);
                description = description.replace(TaskRegularExpressions.dueDateRegex, '').trim();
                matched = true;
            }

            const scheduledDateMatch = description.match(TaskRegularExpressions.scheduledDateRegex);
            if (scheduledDateMatch !== null) {
                scheduledDate = window.moment(scheduledDateMatch[1], TaskRegularExpressions.dateFormat);
                description = description.replace(TaskRegularExpressions.scheduledDateRegex, '').trim();
                matched = true;
            }

            const startDateMatch = description.match(TaskRegularExpressions.startDateRegex);
            if (startDateMatch !== null) {
                startDate = window.moment(startDateMatch[1], TaskRegularExpressions.dateFormat);
                description = description.replace(TaskRegularExpressions.startDateRegex, '').trim();
                matched = true;
            }

            const recurrenceMatch = description.match(TaskRegularExpressions.recurrenceRegex);
            if (recurrenceMatch !== null) {
                recurrence = Recurrence.fromText({
                    recurrenceRuleText: recurrenceMatch[1].trim(),
                    startDate,
                    scheduledDate,
                    dueDate,
                });

                description = description.replace(TaskRegularExpressions.recurrenceRegex, '').trim();
                matched = true;
            }

            runs++;
        } while (matched && runs <= maxRuns);

        // Tags are found in the string and pulled out but not removed,
        // so when returning the entire task it will match what the user
        // entered.
        // The global filter will be removed from the collection.
        const hashTagMatch = description.match(TaskRegularExpressions.hashTags);
        if (hashTagMatch !== null) {
            tags = hashTagMatch.filter((tag) => tag !== globalFilter).map((tag) => tag.trim());
        }

        const task = new Task({
            status,
            description,
            path,
            file,
            indentation,
            sectionStart,
            sectionIndex,
            precedingHeader,
            priority,
            startDate,
            scheduledDate,
            dueDate,
            doneDate,
            createdDate,
            recurrence,
            blockLink,
            tags,
            originalMarkdown: line,
        });

        return task;
    }

    private static toTooltipDate({ signifier, date }: { signifier: string; date: Moment }): string {
        return `${signifier} ${date.format(TaskRegularExpressions.dateFormat)} (${date.from(
            window.moment().startOf('day'),
        )})`;
    }

    /**
     * Renders a list item the same way Obsidian does. Note that anything between the
     * square brackets means it is 'checked' this is not the same as done.
     *
     * @param {{
     *         parentUlElement: HTMLElement;
     *         listIndex: number;
     *         layoutOptions?: LayoutOptions;
     *         isFilenameUnique?: boolean;
     *     }} {
     *         parentUlElement,
     *         listIndex,
     *         layoutOptions,
     *         isFilenameUnique,
     *     }
     * @return {*}  {Promise<HTMLLIElement>}
     * @memberof Task
     */

    public async toLi({
        parentUlElement,
        listIndex,
        layoutOptions,
    }: {
        parentUlElement: HTMLElement;
        /** The nth item in this list (including non-tasks). */
        listIndex: number;
        layoutOptions?: LayoutOptions;
        isFilenameUnique?: boolean;
    }): Promise<HTMLLIElement> {
        let taskAsString = this.toString(layoutOptions);
        const { globalFilter, removeGlobalFilter } = getSettings();

        // Hide the global filter when rendering the query results.
        if (removeGlobalFilter) {
            taskAsString = taskAsString.replace(globalFilter, '').trim();
        }

        // Generate top level list item.
        const li: HTMLLIElement = parentUlElement.createEl('li');

        li.setAttr('data-line', listIndex);
        li.setAttr('data-task', this.status.indicator.trim()); // Trim to ensure empty attribute for space. Same way as obsidian.
        li.addClasses(['task-list-item', 'plugin-tasks-list-item']);
        if (this.status.indicator !== ' ') {
            li.addClass('is-checked');
        }

        const textSpan = li.createSpan();
        textSpan.addClass('tasks-list-text');

        // If there is no links then just set span to text, saves a ms or so per item.
        if (taskAsString.indexOf('[[') != -1 && taskAsString.indexOf(']]') != -1) {
            await MarkdownRenderer.renderMarkdown(taskAsString, textSpan, this.path, null as unknown as Component);
        } else {
            textSpan.textContent = taskAsString;
        }

        // If the task is a block quote, the block quote wraps the p-tag that contains the content.
        // In that case, we need to unwrap the p-tag *inside* the surrounding block quote.
        // Otherwise, we unwrap the p-tag as a direct descendant of the textSpan.
        const blockQuote = textSpan.querySelector('blockquote');
        const directParentOfPTag = blockQuote ?? textSpan;

        // Unwrap the p-tag that was created by the MarkdownRenderer:
        const pElement = directParentOfPTag.querySelector('p');
        if (pElement !== null) {
            while (pElement.firstChild) {
                directParentOfPTag.insertBefore(pElement.firstChild, pElement);
            }
            pElement.remove();
        }

        // Remove an empty trailing p-tag that the MarkdownRenderer appends when there is a block link:
        textSpan.findAll('p').forEach((pElement) => {
            if (!pElement.hasChildNodes()) {
                pElement.remove();
            }
        });

        // Remove the footnote that the MarkdownRenderer appends when there is a footnote in the task:
        textSpan.findAll('.footnotes').forEach((footnoteElement) => {
            footnoteElement.remove();
        });

        const checkbox = li.createEl('input');
        checkbox.setAttr('data-line', listIndex);
        if (this.status.indicator !== ' ') {
            checkbox.checked = true;
        }
        checkbox.type = 'checkbox';
        checkbox.addClass('task-list-item-checkbox');

        checkbox.onClickEvent((event: MouseEvent) => {
            event.preventDefault();
            // It is required to stop propagation so that obsidian won't write the file with the
            // checkbox (un)checked. Obsidian would write after us and overwrite our change.
            event.stopPropagation();

            // Should be re-rendered as enabled after update in file.
            checkbox.disabled = true;
            const toggledTasks = this.toggle();
            replaceTaskWithTasks({
                originalTask: this,
                newTasks: toggledTasks,
            });
        });

        li.prepend(checkbox);

        if (layoutOptions?.shortMode) {
            this.addTooltip({ element: textSpan });
        }

        return li;
    }

    /**
     * Returns a string representation of the task. This is the entire body after the
     * markdown task prefix. ( - [ ] )
     *
     * This is called to render the task in markdown and as part of
     * the query results. This complicates some of the logic and needs
     * to be split out long term so render is not part of the base Task
     * and markdown structure.
     *
     * @param {LayoutOptions} [layoutOptions]
     * @return {*}  {string}
     * @memberof Task
     */

    public toString(layoutOptions?: LayoutOptions): string {
        layoutOptions = layoutOptions ?? new LayoutOptions();

        let taskString = this.description.trim();

        const globalFilter = getGeneralSetting('globalFilter');

        // New feature. Only enabled if user turns on the APPEND_GLOBAL_FILTER feature. Will
        // append the filter rather than forcing it to the front.
        if (isFeatureEnabled('APPEND_GLOBAL_FILTER') && getGeneralSetting('appendGlobalFilter')) {
            taskString = `${taskString} ${globalFilter}`.trim();
        } else {
            // Default is to have filter at front.
            taskString = `${globalFilter} ${taskString}`.trim();
        }

        // Add before the existing tags as they use old processing logic.
        if (this.createdDate && this.createdDate.isRendered && this.createdDate.hasValue) {
            taskString += ' ' + this.createdDate.toRenderedString(layoutOptions.shortMode);
        }

        if (!layoutOptions.hidePriority) {
            let priority: string = '';

            if (this.priority === Priority.High) {
                priority = ' ⏫';
            } else if (this.priority === Priority.Medium) {
                priority = ' 🔼';
            } else if (this.priority === Priority.Low) {
                priority = ' 🔽';
            }

            taskString += priority;
        }

        if (!layoutOptions.hideRecurrenceRule && this.recurrence) {
            const recurrenceRule: string = layoutOptions.shortMode ? ' 🔁' : ` 🔁 ${this.recurrence.toText()}`;
            taskString += recurrenceRule;
        }

        if (!layoutOptions.hideStartDate && this.startDate) {
            const startDate: string = layoutOptions.shortMode
                ? ' 🛫'
                : ` 🛫 ${this.startDate.format(TaskRegularExpressions.dateFormat)}`;
            taskString += startDate;
        }

        if (!layoutOptions.hideScheduledDate && this.scheduledDate) {
            const scheduledDate: string = layoutOptions.shortMode
                ? ' ⏳'
                : ` ⏳ ${this.scheduledDate.format(TaskRegularExpressions.dateFormat)}`;
            taskString += scheduledDate;
        }

        if (!layoutOptions.hideDueDate && this.dueDate) {
            const dueDate: string = layoutOptions.shortMode
                ? ' 📅'
                : ` 📅 ${this.dueDate.format(TaskRegularExpressions.dateFormat)}`;
            taskString += dueDate;
        }

        if (!layoutOptions.hideDoneDate && this.doneDate) {
            const doneDate: string = layoutOptions.shortMode
                ? ' ✅'
                : ` ✅ ${this.doneDate.format(TaskRegularExpressions.dateFormat)}`;
            taskString += doneDate;
        }

        const blockLink: string = this.blockLink ?? '';
        taskString += blockLink;

        return taskString;
    }

    /**
     * Returns the Task as a list item with a checkbox.
     *
     * @return {*}  {string}
     * @memberof Task
     */

    public toFileLineString(): string {
        return `${this.indentation}- [${this.status.indicator}] ${this.toString().trim()}`;
    }

    public toRecord(): TaskRecord {
        return {
            status: this.status,
            description: this.description,
            path: this.path,
            file: this.file,
            indentation: this.indentation,
            sectionStart: this.sectionStart,
            sectionIndex: this.sectionIndex,
            precedingHeader: this.precedingHeader,
            tags: this.tags,
            blockLink: this.blockLink,
            priority: this.priority,
            startDate: this.startDate ? this.startDate.toDate() : null,
            scheduledDate: this.scheduledDate ? this.scheduledDate.toDate() : null,
            dueDate: this.dueDate ? this.dueDate.toDate() : null,
            createdDate: this.createdDate && this.createdDate.value ? this.createdDate.value.toDate() : null,
            doneDate: this.doneDate ? this.doneDate.toDate() : null,
            recurrence: this.recurrence ? this.recurrence.toRecord() : null,
            originalMarkdown: this.originalMarkdown,
        };
    }

    /**
     * Toggles this task and returns the resulting tasks.
     *
     * Toggling can result in more than one returned task in the case of
     * recurrence. If it is a recurring task, the toggled task will be returned
     * together with the next occurrence in the order `[next, toggled]`. If the
     * task is not recurring, it will return `[toggled]`.
     */

    public toggle(status?: Status): Task[] {
        let newStatus = StatusRegistry.getInstance().getNextStatus(this.status);
        if (status !== undefined) {
            newStatus = status;
        }

        let newDoneDate = null;

        let nextOccurrence: {
            startDate: Moment | null;
            scheduledDate: Moment | null;
            dueDate: Moment | null;
        } | null = null;

        if (newStatus.isCompleted()) {
            // Set done date only if setting value is true
            const { setDoneDate } = getSettings();
            if (setDoneDate) {
                newDoneDate = window.moment();
            }

            // If this task is no longer todo, we need to check if it is recurring:
            if (this.recurrence !== null) {
                nextOccurrence = this.recurrence.next();
            }
        }

        const toggledTask = new Task({
            ...this,
            status: newStatus,
            doneDate: newDoneDate,
        });

        const newTasks: Task[] = [];

        if (nextOccurrence !== null) {
            const nextTask = new Task({
                ...this,
                ...nextOccurrence,
                // New occurrences cannot have the same block link.
                // And random block links don't help.
                blockLink: '',
            });
            newTasks.push(nextTask);
        }

        // Write next occurrence before previous occurrence.
        newTasks.push(toggledTask);

        return newTasks;
    }

    /**
     * Returns the text that should be displayed to the user when linking to the origin of the task
     *
     * @param isFilenameUnique {boolean|null} Whether the name of the file that contains the task is unique in the vault.
     *                                        If it is undefined, the outcome will be the same as with a unique file name: the file name only.
     *                                        If set to `true`, the full path will be returned.
     */

    public getLinkText(): string | null {
        let linkText: string | null;
        if (this.isFilenameUnique) {
            linkText = this.filename;
        } else {
            // A slash at the beginning indicates this is a path, not a filename.
            linkText = '/' + this.path;
        }

        if (linkText === null) {
            return null;
        }

        // Otherwise, this wouldn't provide additional information and only take up space.
        if (this.precedingHeader !== null && this.precedingHeader !== linkText) {
            linkText = linkText + ' > ' + this.precedingHeader;
        }

        return linkText;
    }

    private addTooltip({ element }: { element: HTMLElement }): void {
        element.addEventListener('mouseenter', () => {
            const tooltip = element.createDiv();
            tooltip.addClasses(['tooltip', 'mod-right']);

            if (this.recurrence) {
                const recurrenceDiv = tooltip.createDiv();
                recurrenceDiv.setText(`🔁 ${this.recurrence.toText()}`);
            }

            if (this.startDate) {
                const startDateDiv = tooltip.createDiv();
                startDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '🛫',
                        date: this.startDate,
                    }),
                );
            }

            if (this.scheduledDate) {
                const scheduledDateDiv = tooltip.createDiv();
                scheduledDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '⏳',
                        date: this.scheduledDate,
                    }),
                );
            }

            if (this.dueDate) {
                const dueDateDiv = tooltip.createDiv();
                dueDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '📅',
                        date: this.dueDate,
                    }),
                );
            }

            if (this.doneDate) {
                const doneDateDiv = tooltip.createDiv();
                doneDateDiv.setText(
                    Task.toTooltipDate({
                        signifier: '✅',
                        date: this.doneDate,
                    }),
                );
            }

            const linkText = this.getLinkText();
            if (linkText) {
                const backlinkDiv = tooltip.createDiv();
                backlinkDiv.setText(`🔗 ${linkText}`);
            }

            element.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    }
}
