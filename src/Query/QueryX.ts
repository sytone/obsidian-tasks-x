import alasql from 'alasql';
import { LayoutOptions } from '../LayoutOptions';

import { Task, TaskRecord } from '../Task';
import { rootQueryService } from '../config/LogConfig';
import type { TaskGroups } from './TaskGroups';
import { Group } from './Group';
import { QueryRegularExpressions } from './Query';

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

export interface IQuery {
    source: string;
    grouping: Grouping[];
    error: string | undefined;
    layoutOptions: LayoutOptions;
    applyQueryToTasks: (tasks: Task[]) => TaskGroups;
}

export class QueryX implements IQuery {
    public source: string;

    private log = rootQueryService.getChildCategory('QueryX');
    private _layoutOptions: LayoutOptions = new LayoutOptions();
    private _grouping: Grouping[] = [];
    private _error: string | undefined = undefined;

    constructor({ source }: { source: string }) {
        this.source = source.replace(QueryRegularExpressions.commentReplacementRegexp, '');
        source
            .split('\n')
            .map((line: string) => line.trim())
            .forEach((line: string) => {
                switch (true) {
                    case line === '':
                        break;
                    case QueryRegularExpressions.commentRegexp.test(line):
                        {
                            // Comment lines are rendering directives
                            // #hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)
                            // #short
                            // Will be used to filter the columns... probably...
                            const directive = line.slice(1).trim();

                            if (QueryRegularExpressions.shortModeRegexp.test(directive)) {
                                this._layoutOptions.shortMode = true;
                            } else if (QueryRegularExpressions.hideOptionsRegexp.test(directive)) {
                                this.parseHideOptions({ line: directive });
                            }
                        }
                        break;
                }
            });
    }

    public get grouping(): Grouping[] {
        return this._grouping;
    }

    public get error(): string | undefined {
        return this._error;
    }

    public get layoutOptions(): LayoutOptions {
        return this._layoutOptions;
    }

    public applyQueryToTasks(tasks: Task[]): TaskGroups {
        this.log.debug('applyQueryToTasks executing query:', this.source);
        const records: TaskRecord[] = tasks.map((task) => {
            return task.toRecord();
        });
        const queryResult: TaskRecord[] = alasql(this.source, [records]);
        this.log.debug('applyQueryToTasks queryResult:', queryResult.length);
        const foundTasks: Task[] = queryResult.map((task) => {
            return Task.fromTaskRecord(task);
        });
        return Group.by(this.grouping, foundTasks);
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
}
