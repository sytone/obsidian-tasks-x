import alasql from 'alasql';
import { LayoutOptions } from '../LayoutOptions';

import { Task, TaskRecord } from '../Task';
import { log, logCallDetails, loggingAliases } from '../Config/LogConfig';
import type { IQuery } from '../IQuery';
import { TaskGroups } from './TaskGroups';
import { Group } from './Group';
import { QueryRegularExpressions } from './Query';
import { TaskGroup } from './TaskGroup';
import { GroupHeading } from './GroupHeading';

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

@loggingAliases('QueryX')
export class QueryX implements IQuery {
    public source: string;

    private _layoutOptions: LayoutOptions = new LayoutOptions();
    private _grouping: Grouping[] = [];
    private _error: string | undefined = undefined;
    private _groupingPossible: boolean = false;
    private _groupByFields: [string, string][] = [];

    constructor({ source }: { source: string }) {
        const queryPrefix = 'SELECT * FROM ?';

        this.source = source.replace(QueryRegularExpressions.commentReplacementRegexp, '');
        const sqlTokens = this.source.match(/[^\s,;]+|;/gi);

        // If there is a group by clause, then we can do grouping later on, no need to
        // use the existing filters in current grouping classes.
        if (/(^|\s)GROUP BY*/gim.test(this.source)) {
            this._groupingPossible = true;
        }

        if (/^SELECT/gim.test(this.source)) {
            // User has entered a full query. Clean up.
            this.source = this.source.replace(/(^|\s)FROM Tasks*/gim, ' FROM ?');
        } else {
            if (this._groupingPossible && sqlTokens !== null) {
                // Get the column/s we are grouping on. Starting with support
                // for one only.
                for (let index = 0; index < sqlTokens.length; index++) {
                    if (sqlTokens[index] === 'GROUP' && sqlTokens[index + 1] === 'BY') {
                        if (sqlTokens[index + 2].contains('->')) {
                            this._groupByFields.push([sqlTokens[index + 2].split('->')[0], sqlTokens[index + 2]]);
                        } else {
                            this._groupByFields.push([sqlTokens[index + 2], sqlTokens[index + 2]]);
                        }
                    }
                }

                if (this._groupByFields.length > 0) {
                    this.source = `SELECT ${this._groupByFields[0][1]} AS ${this._groupByFields[0][0]}, ARRAY(_) AS tasks FROM ? ${this.source}`;
                } else {
                    this.source = `${queryPrefix} ${this.source}`;
                }
            } else {
                this.source = `${queryPrefix} ${this.source}`;
            }
        }

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

    // public applyQueryToTasks(tasks: Task[]): TaskGroups {
    // }

    @logCallDetails()
    public applyQueryToTasks(tasks: Task[]): TaskGroups {
        log('debug', `'applyQueryToTasks executing query: <strong>[${this.source}]</strong>`);
        const records: TaskRecord[] = tasks.map((task) => {
            return task.toRecord();
        });
        let queryResult: TaskRecord[] = alasql(this.source, [records]);

        if (this._groupingPossible) {
            // There may be sub groups in the returned data. This would be
            // array -> <any>(somefield: value, array -> TaskRecord[])
            // interface GroupedResult {
            //     status: number;
            //     tasks: Array<User>;
            //   }
            const parentGroups: any[] = queryResult;
            const renderedGroups: TaskGroup[] = [];

            for (const group of parentGroups) {
                const currentGroup: [string, any][] = group;
                const groupByFieldName = <string>Object.entries(currentGroup)[0][0];
                const groupByFieldValue = <string>Object.entries(currentGroup)[0][1];
                const groupByFieldTasks = <TaskRecord[]>Object.entries(currentGroup)[1][1];
                const foundTasks: Task[] = groupByFieldTasks.map((task) => {
                    return Task.fromTaskRecord(task);
                });
                renderedGroups.push(
                    new TaskGroup([groupByFieldName], [new GroupHeading(1, groupByFieldValue)], foundTasks),
                );
            }

            const preGrouped = new TaskGroups([], []);
            preGrouped.groups = renderedGroups;
            return preGrouped;
        } else {
            // Should be no grouping so it should be a flat array.
            queryResult = <TaskRecord[]>queryResult;
        }

        log('debug', 'applyQueryToTasks queryResult:', queryResult.length);
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
