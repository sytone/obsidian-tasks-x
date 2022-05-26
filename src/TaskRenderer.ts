import type { Moment } from 'moment';
import { Component, MarkdownRenderer } from 'obsidian';
//import moment from 'moment';

import { StatusRegistry } from './StatusRegistry';
import { replaceTaskWithTasks } from './File';
import { LayoutOptions } from './LayoutOptions';
import { getSettings, isFeatureEnabled } from './config/Settings';
import { Urgency } from './Urgency';
import { Feature } from './config/Feature';
import { Task } from './Task';

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

/**
 * Task encapsulates the properties of the MarkDown task along with
 * the extensions provided by this plugin. This is used to parse and
 * generate the markdown task for all updates and replacements.
 *
 * @export
 * @class TaskRenderer
 */
export class TaskRenderer {
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

    private _urgency: number | null = null;
    task: Task;

    constructor(task: Task) {
        this.task = task;
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
        isFilenameUnique,
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
        li.setAttr('data-task', this.task.status.indicator.trim()); // Trim to ensure empty attribute for space. Same way as obsidian.
        li.addClasses(['task-list-item', 'plugin-tasks-list-item']);
        if (this.task.status.indicator !== ' ') {
            li.addClass('is-checked');
        }

        const textSpan = li.createSpan();
        textSpan.addClass('tasks-list-text');

        await MarkdownRenderer.renderMarkdown(taskAsString, textSpan, this.task.path, null as unknown as Component);

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
        if (this.task.status.indicator !== ' ') {
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
                originalTask: this.task,
                newTasks: toggledTasks,
            });
        });

        li.prepend(checkbox);

        if (layoutOptions?.shortMode) {
            this.addTooltip({ element: textSpan, isFilenameUnique });
        }

        return li;
    }

    /**
     * Returns a string representation of the task. This is the entire body after the
     * markdown task prefix. ( - [ ] )
     *
     * @param {LayoutOptions} [layoutOptions]
     * @return {*}  {string}
     * @memberof Task
     */
    public toString(layoutOptions?: LayoutOptions): string {
        layoutOptions = layoutOptions ?? new LayoutOptions();

        let taskString = this.task.description.trim();
        const { globalFilter } = getSettings();

        if (isFeatureEnabled(Feature.APPEND_GLOBAL_FILTER.internalName)) {
            taskString = `${taskString} ${globalFilter}`.trim();
        } else {
            // Default is to have filter at front.
            taskString = `${globalFilter} ${taskString}`.trim();
        }

        if (!layoutOptions.hidePriority) {
            let priority: string = '';

            if (this.task.priority === Priority.High) {
                priority = ' ⏫';
            } else if (this.task.priority === Priority.Medium) {
                priority = ' 🔼';
            } else if (this.task.priority === Priority.Low) {
                priority = ' 🔽';
            }

            taskString += priority;
        }

        if (!layoutOptions.hideRecurrenceRule && this.task.recurrence) {
            const recurrenceRule: string = layoutOptions.shortMode ? ' 🔁' : ` 🔁 ${this.task.recurrence.toText()}`;
            taskString += recurrenceRule;
        }

        if (!layoutOptions.hideStartDate && this.task.startDate) {
            const startDate: string = layoutOptions.shortMode
                ? ' 🛫'
                : ` 🛫 ${this.task.startDate.format(Task.dateFormat)}`;
            taskString += startDate;
        }

        if (!layoutOptions.hideScheduledDate && this.task.scheduledDate) {
            const scheduledDate: string = layoutOptions.shortMode
                ? ' ⏳'
                : ` ⏳ ${this.task.scheduledDate.format(Task.dateFormat)}`;
            taskString += scheduledDate;
        }

        if (!layoutOptions.hideDueDate && this.task.dueDate) {
            const dueDate: string = layoutOptions.shortMode
                ? ' 📅'
                : ` 📅 ${this.task.dueDate.format(Task.dateFormat)}`;
            taskString += dueDate;
        }

        if (!layoutOptions.hideDoneDate && this.task.doneDate) {
            const doneDate: string = layoutOptions.shortMode
                ? ' ✅'
                : ` ✅ ${this.task.doneDate.format(Task.dateFormat)}`;
            taskString += doneDate;
        }

        const blockLink: string = this.task.blockLink ?? '';
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
        return `${this.task.indentation}- [${this.task.status.indicator}] ${this.toString().trim()}`;
    }

    /**
     * Toggles this task and returns the resulting tasks.
     *
     * Toggling can result in more than one returned task in the case of
     * recurrence. If it is a recurring task, the toggled task will be returned
     * together with the next occurrence in the order `[next, toggled]`. If the
     * task is not recurring, it will return `[toggled]`.
     */
    public toggle(): Task[] {
        const newStatus = StatusRegistry.getInstance().getNextStatus(this.task.status);

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
            if (this.task.recurrence !== null) {
                nextOccurrence = this.task.recurrence.next();
            }
        }

        const toggledTask = new Task({
            ...this.task,
            status: newStatus,
            doneDate: newDoneDate,
        });

        const newTasks: Task[] = [];

        if (nextOccurrence !== null) {
            const nextTask = new Task({
                ...this.task,
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

    public get urgency(): number {
        if (this._urgency === null) {
            this._urgency = Urgency.calculate(this.task);
        }

        return this._urgency;
    }

    public get filename(): string | null {
        const fileNameMatch = this.task.path.match(/([^/]+)\.md$/);
        if (fileNameMatch !== null) {
            return fileNameMatch[1];
        } else {
            return null;
        }
    }

    /**
     * Returns the text that should be displayed to the user when linking to the origin of the task
     *
     * @param isFilenameUnique {boolean|null} Whether the name of the file that contains the task is unique in the vault.
     *                                        If it is undefined, the outcome will be the same as with a unique file name: the file name only.
     *                                        If set to `true`, the full path will be returned.
     */
    public getLinkText({ isFilenameUnique }: { isFilenameUnique: boolean | undefined }): string | null {
        let linkText: string | null;
        if (isFilenameUnique) {
            linkText = this.filename;
        } else {
            // A slash at the beginning indicates this is a path, not a filename.
            linkText = '/' + this.task.path;
        }

        if (linkText === null) {
            return null;
        }

        // Otherwise, this wouldn't provide additional information and only take up space.
        if (this.task.precedingHeader !== null && this.task.precedingHeader !== linkText) {
            linkText = linkText + ' > ' + this.task.precedingHeader;
        }

        return linkText;
    }

    private addTooltip({
        element,
        isFilenameUnique,
    }: {
        element: HTMLElement;
        isFilenameUnique: boolean | undefined;
    }): void {
        element.addEventListener('mouseenter', () => {
            const tooltip = element.createDiv();
            tooltip.addClasses(['tooltip', 'mod-right']);

            if (this.task.recurrence) {
                const recurrenceDiv = tooltip.createDiv();
                recurrenceDiv.setText(`🔁 ${this.task.recurrence.toText()}`);
            }

            if (this.task.startDate) {
                const startDateDiv = tooltip.createDiv();
                startDateDiv.setText(
                    TaskRenderer.toTooltipDate({
                        signifier: '🛫',
                        date: this.task.startDate,
                    }),
                );
            }

            if (this.task.scheduledDate) {
                const scheduledDateDiv = tooltip.createDiv();
                scheduledDateDiv.setText(
                    TaskRenderer.toTooltipDate({
                        signifier: '⏳',
                        date: this.task.scheduledDate,
                    }),
                );
            }

            if (this.task.dueDate) {
                const dueDateDiv = tooltip.createDiv();
                dueDateDiv.setText(
                    TaskRenderer.toTooltipDate({
                        signifier: '📅',
                        date: this.task.dueDate,
                    }),
                );
            }

            if (this.task.doneDate) {
                const doneDateDiv = tooltip.createDiv();
                doneDateDiv.setText(
                    TaskRenderer.toTooltipDate({
                        signifier: '✅',
                        date: this.task.doneDate,
                    }),
                );
            }

            const linkText = this.getLinkText({ isFilenameUnique });
            if (linkText) {
                const backlinkDiv = tooltip.createDiv();
                backlinkDiv.setText(`🔗 ${linkText}`);
            }

            element.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    }

    private static toTooltipDate({ signifier, date }: { signifier: string; date: Moment }): string {
        return `${signifier} ${date.format(Task.dateFormat)} (${date.from(window.moment().startOf('day'))})`;
    }
}
