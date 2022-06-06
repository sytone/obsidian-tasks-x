import { LayoutOptions } from '../LayoutOptions';
import type { Task } from '../Task';
import type { IQuery } from '../IQuery';
import { Status } from '../Status';
import { Group } from './Group';
import type { TaskGroups } from './TaskGroups';

import { Sort } from './Sort';

import type { Field } from './Filter/Field';
import { DescriptionField } from './Filter/DescriptionField';
import { DoneDateField } from './Filter/DoneDateField';
import { DueDateField } from './Filter/DueDateField';
import { HeadingField } from './Filter/HeadingField';
import { PathField } from './Filter/PathField';
import { PriorityField } from './Filter/PriorityField';
import { ScheduledDateField } from './Filter/ScheduledDateField';
import { StartDateField } from './Filter/StartDateField';
import { HappensDateField } from './Filter/HappensDateField';
import { TagsField } from './Filter/TagsField';

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

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

export class Query implements IQuery {
    public source: string;
    public name: string;

    private _limit: number | undefined = undefined;
    private _layoutOptions: LayoutOptions = new LayoutOptions();
    private _filters: ((task: Task) => boolean)[] = [];
    private _error: string | undefined = undefined;
    private _sorting: Sorting[] = [];
    private _grouping: Grouping[] = [];

    private readonly noStartString = 'no start date';
    private readonly hasStartString = 'has start date';

    private readonly noScheduledString = 'no scheduled date';
    private readonly hasScheduledString = 'has scheduled date';

    private readonly noDueString = 'no due date';
    private readonly hasDueString = 'has due date';

    private readonly doneString = 'done';
    private readonly notDoneString = 'not done';

    // If a tag is specified the user can also add a number to specify
    // which one to sort by if there is more than one.
    private readonly sortByRegexp =
        /^sort by (urgency|status|priority|start|scheduled|due|done|path|description|tag)( reverse)?[\s]*(\d+)?/;

    private readonly groupByRegexp = /^group by (backlink|filename|folder|heading|path|status)/;

    private readonly hideOptionsRegexp =
        /^hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)/;
    private readonly shortModeRegexp = /^short/;

    private readonly recurringString = 'is recurring';
    private readonly notRecurringString = 'is not recurring';

    private readonly limitRegexp = /^limit (to )?(\d+)( tasks?)?/;
    private readonly excludeSubItemsString = 'exclude sub-items';

    private readonly commentRegexp = /^#.*/;

    constructor({ source }: { source: string }) {
        this.name = 'Query';
        this.source = source;
        source
            .split('\n')
            .map((line: string) => line.trim())
            .forEach((line: string) => {
                switch (true) {
                    case line === '':
                        break;
                    case line === this.doneString:
                        this._filters.push((task) => task.status === Status.DONE);
                        break;
                    case line === this.notDoneString:
                        this._filters.push((task) => task.status !== Status.DONE);
                        break;
                    case line === this.recurringString:
                        this._filters.push((task) => task.recurrence !== null);
                        break;
                    case line === this.notRecurringString:
                        this._filters.push((task) => task.recurrence === null);
                        break;
                    case line === this.excludeSubItemsString:
                        this._filters.push((task) => task.indentation === '');
                        break;
                    case line === this.noStartString:
                        this._filters.push((task) => task.startDate === null);
                        break;
                    case line === this.noScheduledString:
                        this._filters.push((task) => task.scheduledDate === null);
                        break;
                    case line === this.noDueString:
                        this._filters.push((task) => task.dueDate === null);
                        break;
                    case line === this.hasStartString:
                        this._filters.push((task) => task.startDate !== null);
                        break;
                    case line === this.hasScheduledString:
                        this._filters.push((task) => task.scheduledDate !== null);
                        break;
                    case line === this.hasDueString:
                        this._filters.push((task) => task.dueDate !== null);
                        break;
                    case this.shortModeRegexp.test(line):
                        this._layoutOptions.shortMode = true;
                        break;
                    case this.parseFilter(line, new PriorityField()):
                        break;
                    case this.parseFilter(line, new HappensDateField()):
                        break;
                    case this.parseFilter(line, new StartDateField()):
                        break;
                    case this.parseFilter(line, new ScheduledDateField()):
                        break;
                    case this.parseFilter(line, new DueDateField()):
                        break;
                    case this.parseFilter(line, new DoneDateField()):
                        break;
                    case this.parseFilter(line, new PathField()):
                        break;
                    case this.parseFilter(line, new DescriptionField()):
                        break;
                    case this.parseFilter(line, new TagsField()):
                        break;
                    case this.parseFilter(line, new HeadingField()):
                        break;
                    case this.limitRegexp.test(line):
                        this.parseLimit({ line });
                        break;
                    case this.sortByRegexp.test(line):
                        this.parseSortBy({ line });
                        break;
                    case this.groupByRegexp.test(line):
                        this.parseGroupBy({ line });
                        break;
                    case this.hideOptionsRegexp.test(line):
                        this.parseHideOptions({ line });
                        break;
                    case this.commentRegexp.test(line):
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

    // private static stringIncludesCaseInsensitive(haystack: string, needle: string): boolean {
    //     return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
    // }

    public applyQueryToTasks(tasks: Task[]): TaskGroups {
        this.filters.forEach((filter) => {
            tasks = tasks.filter(filter);
        });

        const tasksSortedLimited = Sort.by(this, tasks).slice(0, this.limit);
        return Group.by(this.grouping, tasksSortedLimited);
    }

    private parseHideOptions({ line }: { line: string }): void {
        const hideOptionsMatch = line.match(this.hideOptionsRegexp);
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

    private parseFilter(line: string, field: Field) {
        if (field.canCreateFilterForLine(line)) {
            const { filter, error } = field.createFilterOrErrorMessage(line);

            if (filter) {
                this._filters.push(filter);
            } else {
                this._error = error;
            }
            return true;
        } else {
            return false;
        }
    }

    private parseLimit({ line }: { line: string }): void {
        const limitMatch = line.match(this.limitRegexp);
        if (limitMatch !== null) {
            // limitMatch[2] is per regex always digits and therefore parsable.
            this._limit = Number.parseInt(limitMatch[2], 10);
        } else {
            this._error = 'do not understand query limit';
        }
    }

    private parseSortBy({ line }: { line: string }): void {
        const fieldMatch = line.match(this.sortByRegexp);
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
        const fieldMatch = line.match(this.groupByRegexp);
        if (fieldMatch !== null) {
            this._grouping.push({
                property: fieldMatch[1] as GroupingProperty,
            });
        } else {
            this._error = 'do not understand query grouping';
        }
    }
}
