import alasql from 'alasql';
import moment from 'moment';

import ADLER32 from 'adler-32';

import { LayoutOptions } from '../LayoutOptions';

import { Task, TaskRecord } from '../Task';
import type { IQuery } from '../IQuery';
import { TaskGroups } from '../Query/TaskGroups';
import { Group } from '../Query/Group';
import { TaskGroup } from '../Query/TaskGroup';
import { GroupHeading } from '../Query/GroupHeading';
import { logging } from '../lib/logging';
import TasksServices from '../TasksServices';
import { isFeatureEnabled } from '../Config/Settings';

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

export class QuerySql implements IQuery {
    public source: string;
    public name: string;
    public sourceHash: string;

    // @ts-ignore
    private _sourcePath: string;
    // @ts-ignore
    private _frontmatter: any | null | undefined;

    private _layoutOptions: LayoutOptions = new LayoutOptions();
    private _grouping: Grouping[] = [];
    private _error: string | undefined = undefined;
    private _groupingPossible: boolean = false;
    private _groupByFields: [string, string][] = [];
    private _rawMode: boolean = false;
    private _rawWithTasksMode: boolean = false;
    logger = logging.getLogger('taskssql.QuerySql');

    private _commentReplacementRegexp = /(^#.*$(\r\n|\r|\n)?)/gm;
    private _commentRegexp = /^#.*/;
    private _hideOptionsRegexp =
        /^hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)/;
    private _shortModeRegexp = /^short/;
    private _rawQuery = /^raw (empty|tasks)/;
    private _customJSRegexp = /^customjs (.*) (.*)/;
    private _customTemplateRegexp = /^template (.*)/;

    private _customJsClasses: Array<[string, string]>;
    private _customTemplate: string = '';

    constructor({
        source,
        sourcePath,
        frontmatter,
    }: {
        source: string;
        sourcePath: string;
        frontmatter: any | null | undefined;
    }) {
        this.name = 'QuerySql';

        this.sourceHash = ADLER32.str(source).toString();

        this._sourcePath = sourcePath;
        this._frontmatter = frontmatter;
        this._customJsClasses = [];

        source
            .split('\n')
            .map((line: string) => line.trim())
            .forEach((line: string) => {
                switch (true) {
                    case line === '':
                        break;
                    case this._commentRegexp.test(line):
                        {
                            // Comment lines are rendering directives
                            // #hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)
                            // #short
                            // #raw (empty|tasks)
                            // Will be used to filter the columns... probably...
                            const directive = line.slice(1).trim();

                            if (this._shortModeRegexp.test(directive)) {
                                this._layoutOptions.shortMode = true;
                            } else if (this._hideOptionsRegexp.test(directive)) {
                                this.parseHideOptions({ line: directive });
                            } else if (this._rawQuery.test(directive)) {
                                this._rawMode = true;
                                const rawOptions = directive.match(this._rawQuery);
                                if (rawOptions !== null && rawOptions[1].trim().toLowerCase() === 'empty') {
                                    this._rawWithTasksMode = false;
                                } else {
                                    this._rawWithTasksMode = true;
                                }
                            } else if (this._customJSRegexp.test(directive)) {
                                const customJSClasses = directive.match(this._customJSRegexp);
                                if (
                                    customJSClasses !== null &&
                                    customJSClasses[1].trim() !== '' &&
                                    customJSClasses[2].trim() !== ''
                                ) {
                                    this._customJsClasses.push([customJSClasses[1].trim(), customJSClasses[2].trim()]);
                                }
                            } else if (this._customTemplateRegexp.test(directive)) {
                                // Search for #template <template>.
                                if (isFeatureEnabled('ENABLE_INLINE_TEMPLATE')) {
                                    const customTemplate = directive.match(this._customTemplateRegexp);
                                    if (customTemplate !== null && customTemplate[1].trim() !== '') {
                                        this._customTemplate = customTemplate[1].trim();
                                    }
                                }
                            }
                        }
                        break;
                }
            });

        const queryPrefix = 'SELECT * FROM ?';

        this.source = source.replace(this._commentReplacementRegexp, '').trim();

        // Exit out if raw with no set table to query.
        if (this._rawMode && !this._rawWithTasksMode) {
            return;
        }
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
    }

    public get grouping(): Grouping[] {
        return this._grouping;
    }

    public get error(): string | undefined {
        return this._error;
    }

    public get template(): string | undefined {
        return this._customTemplate;
    }

    public get layoutOptions(): LayoutOptions {
        return this._layoutOptions;
    }

    // public applyQueryToTasks(tasks: Task[]): TaskGroups {
    // }

    public applyQueryToTasks(queryId: string, tasks: Task[]): TaskGroups {
        this.logger.debugWithId(queryId, `Executing query: [${this.source}]`);

        const records: TaskRecord[] = tasks.map((task) => {
            return task.toRecord();
        });

        /*
         * As we are using alaSQL we can take advantage of a in memory cache. The pagedata
         * table contains the source path for the executing code block when rendered. This
         * allows the code block to reference the page it is being rendered on and access
         * the page meta data for more complex queries.
         */
        if (alasql('SHOW TABLES FROM alasql LIKE "pagedata"').length == 0) {
            alasql('CREATE TABLE pagedata (name STRING, keyvalue STRING)');
        }

        if (alasql(`SELECT keyvalue FROM pagedata WHERE name = "sourcePath${queryId}"`).length == 0) {
            alasql(`INSERT INTO pagedata VALUES ('sourcePath${queryId}','${this._sourcePath}')`);
        }

        // Set moment() function available to AlaSQL
        alasql.fn.moment = moment;

        alasql.fn.pageProperty = function (field) {
            return field;
        };

        this._customJsClasses.forEach((element) => {
            alasql.fn[element[1]] = window.customJS[element[0]][element[1]];
        });

        alasql.fn.debugMe = function () {
            // eslint-disable-next-line no-debugger
            debugger;
        };

        alasql.fn.queryBlockFile = function () {
            const result = alasql(`SELECT keyvalue FROM pagedata WHERE name = "sourcePath${queryId}"`);
            if (result.length == 1) {
                const fileCache = TasksServices.obsidianApp.metadataCache.getCache(result[0].keyvalue);

                return {
                    frontmatter: fileCache?.frontmatter,
                    tags: fileCache?.tags,
                    path: result[0].keyvalue,
                    basename: result[0].keyvalue.split('/').slice(-1)[0].split('.')[0],
                };
            }

            return {
                frontmatter: null,
                tags: [],
                path: result[0].keyvalue,
                basename: result[0].keyvalue.split('/').slice(-1)[0].split('.')[0],
            };
        };

        alasql.fn.queryId = function () {
            return queryId;
        };

        alasql.options.nocount = true; // Disable row count for queries.
        //console.log(alasql(`DECLARE @queryId STRING = '${queryId}';`));

        if (this._rawMode && !this._rawWithTasksMode) {
            const rawResult = alasql(this.source);
            this.logger.infoWithId(queryId, 'RAW Data result from AlaSQL query', rawResult);
            return new TaskGroups([], []);
        }

        let queryResult: TaskRecord[] = alasql(this.source, [records]);
        this.logger.debugWithId(queryId, `queryResult: ${queryResult.length}`);

        if (this._rawMode && this._rawWithTasksMode) {
            this.logger.infoWithId(queryId, 'RAW Data result from AlaSQL query', queryResult);
        }

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

        const foundTasks: Task[] = queryResult.map((task) => {
            return Task.fromTaskRecord(task);
        });
        return Group.by(this.grouping, foundTasks);
    }

    private parseHideOptions({ line }: { line: string }): void {
        const hideOptionsMatch = line.match(this._hideOptionsRegexp);
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
