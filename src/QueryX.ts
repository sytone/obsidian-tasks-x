import alasql from 'alasql';
import { Group } from './Query/Group';
import type { TaskGroups } from './Query/TaskGroups';

import type { Task } from './Task';
import { rootQueryService } from './config/LogConfig';

export type GroupingProperty = 'backlink' | 'filename' | 'folder' | 'heading' | 'path' | 'status';
export type Grouping = { property: GroupingProperty };

export class QueryX {
    private readonly commentRegexp = /^#.*/;

    public source: string;
    private _grouping: Grouping[] = [];
    private _error: string | undefined = undefined;
    log = rootQueryService.getChildCategory('QueryX');

    constructor({ source }: { source: string }) {
        this.source = source;
        source
            .split('\n')
            .map((line: string) => line.trim())
            .forEach((line: string) => {
                switch (true) {
                    case line === '':
                        break;
                    case this.commentRegexp.test(line):
                        // Comment lines are rendering directives
                        // #hide (task count|backlink|priority|start date|scheduled date|done date|due date|recurrence rule|edit button)
                        // Will be used to filter the columns... probably...
                        break;
                }
            });
    }

    public get grouping() {
        return this._grouping;
    }

    public get error(): string | undefined {
        return this._error;
    }

    public applyQueryToTasks(tasks: Task[]): TaskGroups {
        this.log.debug('applyQueryToTasks executing query:', this.source);
        const queryResult = alasql(this.source, [tasks]);
        return Group.by(this.grouping, queryResult);
    }
}
