import * as chrono from 'chrono-node';

import { getSettings } from '../Config/Settings';
import { LayoutOptions } from '../LayoutOptions';
import { Status } from '../Status';
import { Priority, Task } from '../Task';
import { StatusRegistry } from '../StatusRegistry';
import type { IQuery } from '../IQuery';
import { Sort } from './Sort';
import type { TaskGroups } from './TaskGroups';
import { Group } from './Group';

export type SortingProperty =
    | 'urgency'
    | 'status'
    | 'priority'
    | 'start'
    | 'scheduled'
    | 'due'
    | 'done'
    | 'path'
    | 'description'
    | 'tag';
type Sorting = {
    property: SortingProperty;
    reverse: boolean;
    propertyInstance: number;
};

export class QueryRegularExpressions {
    public static readonly priorityRegexp = /^priority (is )?(above|below)? ?(low|none|medium|high)/;

    public static readonly happensRegexp = /^happens (before|after|on)? ?(.*)/;

    public static readonly noStartString = 'no start date';
    public static readonly hasStartString = 'has start date';
    public static readonly startRegexp = /^starts (before|after|on)? ?(.*)/;

    public static readonly noScheduledString = 'no scheduled date';
    public static readonly hasScheduledString = 'has scheduled date';
    public static readonly scheduledRegexp = /^scheduled (before|after|on)? ?(.*)/;

    public static readonly noDueString = 'no due date';
    public static readonly hasDueString = 'has due date';
    public static readonly dueRegexp = /^due (before|after|on)? ?(.*)/;

    public static readonly doneString = 'done';
    public static readonly notDoneString = 'not done';
    public static readonly doneRegexp = /^done (before|after|on)? ?(.*)/;

    public static readonly statusRegexp = /^status (is not|is) (.*)/;

    public static readonly pathRegexp = /^path (includes|does not include) (.*)/;
    public static readonly descriptionRegexp = /^description (includes|does not include) (.*)/;

    // Handles both ways of referencing the tags query.
    public static readonly tagRegexp = /^(tag|tags) (includes|does not include|include|do not include) (.*)/;

    // If a tag is specified the user can also add a number to specify
    // which one to sort by if there is more than one.
    public static readonly sortByRegexp =
        /^sort by (urgency|status|priority|start|scheduled|due|done|path|description|tag)( reverse)?[\s]*(\d+)?/;

    public static readonly groupByRegexp = /^group by (backlink|filename|folder|heading|path|status)/;

    public static readonly headingRegexp = /^heading (includes|does not include) (.*)/;

    public static readonly hideOptionsRegexp =
        /^hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)/;
    public static readonly shortModeRegexp = /^short/;

    public static readonly recurringString = 'is recurring';
    public static readonly notRecurringString = 'is not recurring';

    public static readonly limitRegexp = /^limit (to )?(\d+)( tasks?)?/;
    public static readonly excludeSubItemsString = 'exclude sub-items';

    public static readonly commentRegexp = /^#.*/;
    public static readonly commentReplacementRegexp = /(^#.*$(\r\n|\r|\n)?)/gm;
}

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

export class Query implements IQuery {
    public source: string;

    private _limit: number | undefined = undefined;
    private _layoutOptions: LayoutOptions = new LayoutOptions();
    private _filters: ((task: Task) => boolean)[] = [];
    private _error: string | undefined = undefined;
    private _sorting: Sorting[] = [];
    private _grouping: Grouping[] = [];

    constructor({ source }: { source: string }) {
        this.source = source;
        source
            .split('\n')
            .map((line: string) => line.trim())
            .forEach((line: string) => {
                switch (true) {
                    case line === '':
                        break;
                    case line === QueryRegularExpressions.doneString:
                        this._filters.push((task) => task.status === Status.DONE);
                        break;
                    case line === QueryRegularExpressions.notDoneString:
                        this._filters.push((task) => task.status !== Status.DONE);
                        break;
                    case line === QueryRegularExpressions.recurringString:
                        this._filters.push((task) => task.recurrence !== null);
                        break;
                    case line === QueryRegularExpressions.notRecurringString:
                        this._filters.push((task) => task.recurrence === null);
                        break;
                    case line === QueryRegularExpressions.excludeSubItemsString:
                        this._filters.push((task) => task.indentation === '');
                        break;
                    case line === QueryRegularExpressions.noStartString:
                        this._filters.push((task) => task.startDate === null);
                        break;
                    case line === QueryRegularExpressions.noScheduledString:
                        this._filters.push((task) => task.scheduledDate === null);
                        break;
                    case line === QueryRegularExpressions.noDueString:
                        this._filters.push((task) => task.dueDate === null);
                        break;
                    case line === QueryRegularExpressions.hasStartString:
                        this._filters.push((task) => task.startDate !== null);
                        break;
                    case line === QueryRegularExpressions.hasScheduledString:
                        this._filters.push((task) => task.scheduledDate !== null);
                        break;
                    case line === QueryRegularExpressions.hasDueString:
                        this._filters.push((task) => task.dueDate !== null);
                        break;
                    case QueryRegularExpressions.shortModeRegexp.test(line):
                        this._layoutOptions.shortMode = true;
                        break;
                    case QueryRegularExpressions.priorityRegexp.test(line):
                        this.parsePriorityFilter({ line });
                        break;
                    case QueryRegularExpressions.happensRegexp.test(line):
                        this.parseHappensFilter({ line });
                        break;
                    case QueryRegularExpressions.startRegexp.test(line):
                        this.parseStartFilter({ line });
                        break;
                    case QueryRegularExpressions.scheduledRegexp.test(line):
                        this.parseScheduledFilter({ line });
                        break;
                    case QueryRegularExpressions.dueRegexp.test(line):
                        this.parseDueFilter({ line });
                        break;
                    case QueryRegularExpressions.doneRegexp.test(line):
                        this.parseDoneFilter({ line });
                        break;
                    case QueryRegularExpressions.statusRegexp.test(line):
                        this.parseStatusFilter({ line });
                        break;
                    case QueryRegularExpressions.pathRegexp.test(line):
                        this.parsePathFilter({ line });
                        break;
                    case QueryRegularExpressions.descriptionRegexp.test(line):
                        this.parseDescriptionFilter({ line });
                        break;
                    case QueryRegularExpressions.tagRegexp.test(line):
                        this.parseTagFilter({ line });
                        break;
                    case QueryRegularExpressions.headingRegexp.test(line):
                        this.parseHeadingFilter({ line });
                        break;
                    case QueryRegularExpressions.limitRegexp.test(line):
                        this.parseLimit({ line });
                        break;
                    case QueryRegularExpressions.sortByRegexp.test(line):
                        this.parseSortBy({ line });
                        break;
                    case QueryRegularExpressions.groupByRegexp.test(line):
                        this.parseGroupBy({ line });
                        break;
                    case QueryRegularExpressions.hideOptionsRegexp.test(line):
                        this.parseHideOptions({ line });
                        break;
                    case QueryRegularExpressions.commentRegexp.test(line):
                        // Comment lines are ignored
                        break;
                    default:
                        this._error = `do not understand query: ${line}`;
                }
            });
    }

    public get limit(): number | undefined {
        return this._limit;
    }

    public get layoutOptions(): LayoutOptions {
        return this._layoutOptions;
    }

    public get filters(): ((task: Task) => boolean)[] {
        return this._filters;
    }

    public get sorting() {
        return this._sorting;
    }

    public get grouping() {
        return this._grouping;
    }

    public get error(): string | undefined {
        return this._error;
    }

    private static parseDate(input: string): moment.Moment {
        // Using start of day to correctly match on comparison with other dates (like equality).
        return window.moment(chrono.parseDate(input)).startOf('day');
    }

    private static stringIncludesCaseInsensitive(haystack: string, needle: string): boolean {
        return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
    }

    public applyQueryToTasks(tasks: Task[]): TaskGroups {
        this.filters.forEach((filter) => {
            tasks = tasks.filter(filter);
        });

        const tasksSortedLimited = Sort.by(this, tasks).slice(0, this.limit);
        return Group.by(this.grouping, tasksSortedLimited);
    }

    private parseHideOptions({ line }: { line: string }): void {
        const hideOptionsMatch = line.match(QueryRegularExpressions.hideOptionsRegexp);
        if (hideOptionsMatch !== null) {
            const option = hideOptionsMatch[1].trim().toLowerCase();

            switch (option) {
                case 'task count':
                    this._layoutOptions.hideTaskCount = true;
                    break;
                case 'backlink':
                    this._layoutOptions.hideBacklinks = true;
                    break;
                case 'priority':
                    this._layoutOptions.hidePriority = true;
                    break;
                case 'start date':
                    this._layoutOptions.hideStartDate = true;
                    break;
                case 'scheduled date':
                    this._layoutOptions.hideScheduledDate = true;
                    break;
                case 'due date':
                    this._layoutOptions.hideDueDate = true;
                    break;
                case 'done date':
                    this._layoutOptions.hideDoneDate = true;
                    break;
                case 'recurrence rule':
                    this._layoutOptions.hideRecurrenceRule = true;
                    break;
                case 'edit button':
                    this._layoutOptions.hideEditButton = true;
                    break;
                default:
                    this._error = 'do not understand hide option';
            }
        }
    }

    private parsePriorityFilter({ line }: { line: string }): void {
        const priorityMatch = line.match(QueryRegularExpressions.priorityRegexp);
        if (priorityMatch !== null) {
            const filterPriorityString = priorityMatch[3];
            let filterPriority: Priority | null = null;

            switch (filterPriorityString) {
                case 'low':
                    filterPriority = Priority.Low;
                    break;
                case 'none':
                    filterPriority = Priority.None;
                    break;
                case 'medium':
                    filterPriority = Priority.Medium;
                    break;
                case 'high':
                    filterPriority = Priority.High;
                    break;
            }

            if (filterPriority === null) {
                this._error = 'do not understand priority';
                return;
            }

            let filter;
            if (priorityMatch[2] === 'above') {
                filter = (task: Task) => (task.priority ? task.priority.localeCompare(filterPriority!) < 0 : false);
            } else if (priorityMatch[2] === 'below') {
                filter = (task: Task) => (task.priority ? task.priority.localeCompare(filterPriority!) > 0 : false);
            } else {
                filter = (task: Task) => (task.priority ? task.priority === filterPriority : false);
            }

            this._filters.push(filter);
        } else {
            this._error = 'do not understand query filter (priority date)';
        }
    }

    private parseHappensFilter({ line }: { line: string }): void {
        const happensMatch = line.match(QueryRegularExpressions.happensRegexp);
        if (happensMatch !== null) {
            const filterDate = Query.parseDate(happensMatch[2]);
            if (!filterDate.isValid()) {
                this._error = 'do not understand happens date';
                return;
            }

            let filter;
            if (happensMatch[1] === 'before') {
                filter = (task: Task) => {
                    return Array.of(task.startDate, task.scheduledDate, task.dueDate).some(
                        (date) => date && date.isBefore(filterDate),
                    );
                };
            } else if (happensMatch[1] === 'after') {
                filter = (task: Task) => {
                    return Array.of(task.startDate, task.scheduledDate, task.dueDate).some(
                        (date) => date && date.isAfter(filterDate),
                    );
                };
            } else {
                filter = (task: Task) => {
                    return Array.of(task.startDate, task.scheduledDate, task.dueDate).some(
                        (date) => date && date.isSame(filterDate),
                    );
                };
            }

            this._filters.push(filter);
        } else {
            this._error = 'do not understand query filter (happens date)';
        }
    }

    private parseStartFilter({ line }: { line: string }): void {
        const startMatch = line.match(QueryRegularExpressions.startRegexp);
        if (startMatch !== null) {
            const filterDate = Query.parseDate(startMatch[2]);
            if (!filterDate.isValid()) {
                this._error = 'do not understand start date';
                return;
            }

            let filter;
            if (startMatch[1] === 'before') {
                filter = (task: Task) => (task.startDate ? task.startDate.isBefore(filterDate) : true);
            } else if (startMatch[1] === 'after') {
                filter = (task: Task) => (task.startDate ? task.startDate.isAfter(filterDate) : true);
            } else {
                filter = (task: Task) => (task.startDate ? task.startDate.isSame(filterDate) : true);
            }

            this._filters.push(filter);
        } else {
            this._error = 'do not understand query filter (start date)';
        }
    }

    private parseScheduledFilter({ line }: { line: string }): void {
        const scheduledMatch = line.match(QueryRegularExpressions.scheduledRegexp);
        if (scheduledMatch !== null) {
            const filterDate = Query.parseDate(scheduledMatch[2]);
            if (!filterDate.isValid()) {
                this._error = 'do not understand scheduled date';
            }

            let filter;
            if (scheduledMatch[1] === 'before') {
                filter = (task: Task) => (task.scheduledDate ? task.scheduledDate.isBefore(filterDate) : false);
            } else if (scheduledMatch[1] === 'after') {
                filter = (task: Task) => (task.scheduledDate ? task.scheduledDate.isAfter(filterDate) : false);
            } else {
                filter = (task: Task) => (task.scheduledDate ? task.scheduledDate.isSame(filterDate) : false);
            }

            this._filters.push(filter);
        } else {
            this._error = 'do not understand query filter (scheduled date)';
        }
    }

    private parseDueFilter({ line }: { line: string }): void {
        const dueMatch = line.match(QueryRegularExpressions.dueRegexp);
        if (dueMatch !== null) {
            const filterDate = Query.parseDate(dueMatch[2]);
            if (!filterDate.isValid()) {
                this._error = 'do not understand due date';
                return;
            }

            let filter;
            if (dueMatch[1] === 'before') {
                filter = (task: Task) => (task.dueDate ? task.dueDate.isBefore(filterDate) : false);
            } else if (dueMatch[1] === 'after') {
                filter = (task: Task) => (task.dueDate ? task.dueDate.isAfter(filterDate) : false);
            } else {
                filter = (task: Task) => (task.dueDate ? task.dueDate.isSame(filterDate) : false);
            }

            this._filters.push(filter);
        } else {
            this._error = 'do not understand query filter (due date)';
        }
    }

    private parseDoneFilter({ line }: { line: string }): void {
        const doneMatch = line.match(QueryRegularExpressions.doneRegexp);
        if (doneMatch !== null) {
            const filterDate = Query.parseDate(doneMatch[2]);
            if (!filterDate.isValid()) {
                this._error = 'do not understand done date';
                return;
            }

            let filter;
            if (doneMatch[1] === 'before') {
                filter = (task: Task) => (task.doneDate ? task.doneDate.isBefore(filterDate) : false);
            } else if (doneMatch[1] === 'after') {
                filter = (task: Task) => (task.doneDate ? task.doneDate.isAfter(filterDate) : false);
            } else {
                filter = (task: Task) => (task.doneDate ? task.doneDate.isSame(filterDate) : false);
            }

            this._filters.push(filter);
        }
    }

    /**
     * Parses the status query, will fail if the status is not registered.
     * Uses the RegEx: '^status (is|is not) (.*)'
     *
     * @private
     * @param {{ line: string }} { line }
     * @return {*}  {void}
     * @memberof Query
     */
    private parseStatusFilter({ line }: { line: string }): void {
        const statusMatch = line.match(QueryRegularExpressions.statusRegexp);
        if (statusMatch !== null) {
            const filterStatus = statusMatch[2];

            if (StatusRegistry.getInstance().byIndicator(filterStatus) === Status.EMPTY) {
                this._error = 'status you are searching for is not registered in configuration.';
                return;
            }

            let filter;
            if (statusMatch[1] === 'is') {
                filter = (task: Task) => task.status.indicator === filterStatus;
            } else {
                filter = (task: Task) => task.status.indicator !== filterStatus;
            }

            this._filters.push(filter);
        }
    }

    private parsePathFilter({ line }: { line: string }): void {
        const pathMatch = line.match(QueryRegularExpressions.pathRegexp);
        if (pathMatch !== null) {
            const filterMethod = pathMatch[1];
            if (filterMethod === 'includes') {
                this._filters.push((task: Task) => Query.stringIncludesCaseInsensitive(task.path, pathMatch[2]));
            } else if (pathMatch[1] === 'does not include') {
                this._filters.push((task: Task) => !Query.stringIncludesCaseInsensitive(task.path, pathMatch[2]));
            } else {
                this._error = 'do not understand query filter (path)';
            }
        } else {
            this._error = 'do not understand query filter (path)';
        }
    }

    /**
     * When a tag based filter is used this is the process to apply it.
     * - Tags can be searched for with and without the hash tag at the start.
     *
     * @private
     * @param {{ line: string }} { line }
     * @memberof Query
     */
    private parseTagFilter({ line }: { line: string }): void {
        const tagMatch = line.match(QueryRegularExpressions.tagRegexp);
        if (tagMatch !== null) {
            const filterMethod = tagMatch[2];

            // Search is done sans the hash. If it is provided then strip it off.
            const search = tagMatch[3].replace(/^#/, '');

            if (filterMethod === 'include' || filterMethod === 'includes') {
                this._filters.push(
                    (task: Task) =>
                        task.tags.find((tag) => tag.toLowerCase().includes(search.toLowerCase())) !== undefined,
                );
            } else if (tagMatch[2] === 'do not include' || tagMatch[2] === 'does not include') {
                this._filters.push(
                    (task: Task) =>
                        task.tags.find((tag) => tag.toLowerCase().includes(search.toLowerCase())) == undefined,
                );
            } else {
                this._error = 'do not understand query filter (tag/tags)';
            }
        } else {
            this._error = 'do not understand query filter (tag/tags)';
        }
    }

    private parseDescriptionFilter({ line }: { line: string }): void {
        const descriptionMatch = line.match(QueryRegularExpressions.descriptionRegexp);
        if (descriptionMatch !== null) {
            const filterMethod = descriptionMatch[1];
            const globalFilter = getSettings().globalFilter;

            if (filterMethod === 'includes') {
                this._filters.push((task: Task) =>
                    Query.stringIncludesCaseInsensitive(
                        // Remove global filter from description match if present.
                        // This is necessary to match only on the content of the task, not
                        // the global filter.
                        task.description.replace(globalFilter, '').trim(),
                        descriptionMatch[2],
                    ),
                );
            } else if (descriptionMatch[1] === 'does not include') {
                this._filters.push(
                    (task: Task) =>
                        !Query.stringIncludesCaseInsensitive(
                            // Remove global filter from description match if present.
                            // This is necessary to match only on the content of the task, not
                            // the global filter.
                            task.description.replace(globalFilter, '').trim(),
                            descriptionMatch[2],
                        ),
                );
            } else {
                this._error = 'do not understand query filter (description)';
            }
        } else {
            this._error = 'do not understand query filter (description)';
        }
    }

    private parseHeadingFilter({ line }: { line: string }): void {
        const headingMatch = line.match(QueryRegularExpressions.headingRegexp);
        if (headingMatch !== null) {
            const filterMethod = headingMatch[1].toLowerCase();
            if (filterMethod === 'includes') {
                this._filters.push(
                    (task: Task) =>
                        task.precedingHeader !== null &&
                        Query.stringIncludesCaseInsensitive(task.precedingHeader, headingMatch[2]),
                );
            } else if (headingMatch[1] === 'does not include') {
                this._filters.push(
                    (task: Task) =>
                        task.precedingHeader === null ||
                        !Query.stringIncludesCaseInsensitive(task.precedingHeader, headingMatch[2]),
                );
            } else {
                this._error = 'do not understand query filter (heading)';
            }
        } else {
            this._error = 'do not understand query filter (heading)';
        }
    }

    private parseLimit({ line }: { line: string }): void {
        const limitMatch = line.match(QueryRegularExpressions.limitRegexp);
        if (limitMatch !== null) {
            // limitMatch[2] is per regex always digits and therefore parsable.
            this._limit = Number.parseInt(limitMatch[2], 10);
        } else {
            this._error = 'do not understand query limit';
        }
    }

    private parseSortBy({ line }: { line: string }): void {
        const fieldMatch = line.match(QueryRegularExpressions.sortByRegexp);
        if (fieldMatch !== null) {
            this._sorting.push({
                property: fieldMatch[1] as SortingProperty,
                reverse: !!fieldMatch[2],
                propertyInstance: isNaN(+fieldMatch[3]) ? 1 : +fieldMatch[3],
            });
        } else {
            this._error = 'do not understand query sorting';
        }
    }

    private parseGroupBy({ line }: { line: string }): void {
        const fieldMatch = line.match(QueryRegularExpressions.groupByRegexp);
        if (fieldMatch !== null) {
            this._grouping.push({
                property: fieldMatch[1] as GroupingProperty,
            });
        } else {
            this._error = 'do not understand query grouping';
        }
    }
}
