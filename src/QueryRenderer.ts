import { App, EventRef, MarkdownPostProcessorContext, MarkdownRenderChild, Plugin, TFile } from 'obsidian';

import { State } from './Cache';
import { replaceTaskWithTasks } from './File';
import { TaskModal } from './TaskModal';
import type { TasksEvents } from './TasksEvents';
import type { Task } from './Task';
import { logging } from './Config/../lib/logging';
import type { IQuery } from './IQuery';
import { QuerySql } from './QuerySql/QuerySql';
import { Query } from './Query/Query';
import type { GroupHeading } from './Query/GroupHeading';

export class QueryRenderer {
    public addQueryRenderChild = this._addQueryRenderChild.bind(this);
    public addQuerySqlRenderChild = this._addQuerySqlRenderChild.bind(this);
    _logger = logging.getLogger('taskssql.QueryRenderer');

    private readonly app: App;
    private readonly events: TasksEvents;

    constructor({ plugin, events }: { plugin: Plugin; events: TasksEvents }) {
        this.app = plugin.app;
        this.events = events;

        plugin.registerMarkdownCodeBlockProcessor('tasks', this._addQueryRenderChild.bind(this));
        plugin.registerMarkdownCodeBlockProcessor('task-sql', this._addQuerySqlRenderChild.bind(this));
    }

    private async _addQueryRenderChild(source: string, element: HTMLElement, context: MarkdownPostProcessorContext) {
        this._logger.debug(`Adding Original Query Render for ${source} to context ${context.docId}`);
        context.addChild(
            new QueryRenderChild({
                app: this.app,
                events: this.events,
                container: element,
                queryEngine: new Query({ source }),
            }),
        );
    }

    private async _addQuerySqlRenderChild(source: string, element: HTMLElement, context: MarkdownPostProcessorContext) {
        this._logger.debug(`Adding SQL Query Render for ${source} to context ${context.docId}`);
        context.addChild(
            new QueryRenderChild({
                app: this.app,
                events: this.events,
                container: element,
                queryEngine: new QuerySql({ source, sourcePath: context.sourcePath, frontmatter: context.frontmatter }),
            }),
        );
    }
}

class QueryRenderChild extends MarkdownRenderChild {
    private readonly app: App;
    private readonly events: TasksEvents;
    private readonly queryEngine: IQuery;
    _logger = logging.getLogger('taskssql.QueryRenderChild');

    private renderEventRef: EventRef | undefined;
    private queryReloadTimeout: NodeJS.Timeout | undefined;

    constructor({
        app,
        events,
        container,
        queryEngine,
    }: {
        app: App;
        events: TasksEvents;
        container: HTMLElement;
        queryEngine: IQuery;
    }) {
        super(container);

        this.app = app;
        this.events = events;
        this.queryEngine = queryEngine;

        this._logger.debug(`Query Render generated for class ${this.containerEl.className}`);
    }

    onload() {
        // Process the current cache state:
        this.events.triggerRequestCacheUpdate(this.render.bind(this));
        // Listen to future cache changes:
        this.renderEventRef = this.events.onCacheUpdate(this.render.bind(this));

        this.reloadQueryAtMidnight();
    }

    onunload() {
        if (this.renderEventRef !== undefined) {
            this.events.off(this.renderEventRef);
        }

        if (this.queryReloadTimeout !== undefined) {
            clearTimeout(this.queryReloadTimeout);
        }
    }

    /**
     * Reloads the query after midnight to update results from relative date queries.
     *
     * For example, the query `due today` changes every day. This makes sure that all query results
     * are re-rendered after midnight every day to ensure up-to-date results without having to
     * reload obsidian. Creating a new query object from the source re-applies the relative dates
     * to "now".
     */
    private reloadQueryAtMidnight(): void {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const now = new Date();

        const millisecondsToMidnight = midnight.getTime() - now.getTime();

        this.queryReloadTimeout = setTimeout(() => {
            // Process the current cache state:
            this.events.triggerRequestCacheUpdate(this.render.bind(this));
            this.reloadQueryAtMidnight();
        }, millisecondsToMidnight + 1000); // Add buffer to be sure to run after midnight.
    }

    private async render({ tasks, state }: { tasks: Task[]; state: State }) {
        // This allows tracing of unique query renders through the plugin.
        const startTime = new Date(Date.now());
        //Old: Date.now() + Math.random().toString(36).slice(2, 9);
        const queryId = this.queryEngine.sourceHash;

        this._logger.debugWithId(
            queryId,
            `Render Start: ${tasks.length} tasks, state: ${state}. Using ${this.queryEngine.name}`,
        );
        const content = this.containerEl.createEl('div');
        content.setAttr('data-query-id', queryId);

        if (state === State.Warm && this.queryEngine.error === undefined) {
            const tasksSortedLimitedGrouped = this.queryEngine.applyQueryToTasks(queryId, tasks);

            for (const group of tasksSortedLimitedGrouped.groups) {
                // If there were no 'group by' instructions, group.groupHeadings
                // will be empty, and no headings will be added.
                QueryRenderChild.addGroupHeadings(content, group.groupHeadings);

                const { taskList } = await this.createTasksList({
                    tasks: group.tasks,
                    content: content,
                });
                content.appendChild(taskList);
            }
            const totalTasksCount = tasksSortedLimitedGrouped.totalTasksCount();
            this.addTaskCount(content, totalTasksCount);
        } else if (this.queryEngine.error !== undefined) {
            this._logger.error(`Tasks query (${this.queryEngine.name}) error: ${this.queryEngine.error}`);
            content.setText(`Tasks query error: ${this.queryEngine.error}`);
        } else {
            content.setText('Loading Tasks ...');
        }

        this.containerEl.firstChild?.replaceWith(content);
        const endTime = new Date(Date.now());
        this._logger.debugWithId(queryId, `Render End: ${endTime.getTime() - startTime.getTime()}ms`);
    }

    private async createTasksList({
        tasks,
        content,
    }: {
        tasks: Task[];
        content: HTMLDivElement;
    }): Promise<{ taskList: HTMLUListElement; tasksCount: number }> {
        const tasksCount = tasks.length;

        const taskList = content.createEl('ul');
        taskList.addClasses(['contains-task-list', 'plugin-tasks-query-result']);
        for (let i = 0; i < tasksCount; i++) {
            const task = tasks[i];
            const isFilenameUnique = this.isFilenameUnique({ task });

            const listItem = await task.toLi({
                parentUlElement: taskList,
                listIndex: i,
                layoutOptions: this.queryEngine.layoutOptions,
                isFilenameUnique,
            });

            // Remove all footnotes. They don't re-appear in another document.
            const footnotes = listItem.querySelectorAll('[data-footnote-id]');
            footnotes.forEach((footnote) => footnote.remove());

            const postInfo = listItem.createSpan();
            const shortMode = this.queryEngine.layoutOptions.shortMode;

            if (!this.queryEngine.layoutOptions.hideBacklinks) {
                this.addBacklinks(postInfo, task, shortMode, isFilenameUnique);
            }

            if (!this.queryEngine.layoutOptions.hideEditButton) {
                this.addEditButton(postInfo, task);
            }

            taskList.appendChild(listItem);
        }

        return { taskList, tasksCount };
    }

    private addEditButton(postInfo: HTMLSpanElement, task: Task) {
        const editTaskPencil = postInfo.createEl('a', {
            cls: 'tasks-edit',
        });
        editTaskPencil.onClickEvent((event: MouseEvent) => {
            event.preventDefault();

            const onSubmit = (updatedTasks: Task[]): void => {
                replaceTaskWithTasks({
                    originalTask: task,
                    newTasks: updatedTasks,
                });
            };

            // Need to create a new instance every time, as cursor/task can change.
            const taskModal = new TaskModal({
                app: this.app,
                task,
                onSubmit,
            });
            taskModal.open();
        });
    }

    /**
     * Display headings for a group of tasks.
     * @param content
     * @param groupHeadings - The headings to display. This can be an empty array,
     *                        in which case no headings will be added.
     * @private
     */
    private static addGroupHeadings(content: HTMLDivElement, groupHeadings: GroupHeading[]) {
        for (const heading of groupHeadings) {
            QueryRenderChild.addGroupHeading(content, heading);
        }
    }

    private static addGroupHeading(content: HTMLDivElement, group: GroupHeading) {
        let header: any;
        // Is it possible to remove the repetition here?
        // Ideally, by creating a variable that contains h4, h5 or h6
        // and then only having one call to content.createEl().
        if (group.nestingLevel === 0) {
            header = content.createEl('h4', {
                cls: 'tasks-group-heading',
            });
        } else if (group.nestingLevel === 1) {
            header = content.createEl('h5', {
                cls: 'tasks-group-heading',
            });
        } else {
            // Headings nested to 2 or more levels are all displayed with 'h6:
            header = content.createEl('h6', {
                cls: 'tasks-group-heading',
            });
        }
        header.appendText(group.name);
    }

    private addBacklinks(
        postInfo: HTMLSpanElement,
        task: Task,
        shortMode: boolean,
        isFilenameUnique: boolean | undefined,
    ) {
        postInfo.addClass('tasks-backlink');
        if (!shortMode) {
            postInfo.append(' (');
        }
        const link = postInfo.createEl('a');

        link.href = task.path;
        link.setAttribute('data-href', task.path);
        link.rel = 'noopener';
        link.target = '_blank';
        link.addClass('internal-link');
        if (shortMode) {
            link.addClass('internal-link-short-mode');
        }

        if (task.precedingHeader !== null) {
            link.href = link.href + '#' + task.precedingHeader;
            link.setAttribute('data-href', link.getAttribute('data-href') + '#' + task.precedingHeader);
        }

        let linkText: string;
        if (shortMode) {
            linkText = ' 🔗';
        } else {
            linkText = task.getLinkText({ isFilenameUnique }) ?? '';
        }

        link.setText(linkText);
        if (!shortMode) {
            postInfo.append(')');
        }
    }

    private addTaskCount(content: HTMLDivElement, tasksCount: number) {
        if (!this.queryEngine.layoutOptions.hideTaskCount) {
            content.createDiv({
                text: `${tasksCount} task${tasksCount !== 1 ? 's' : ''}`,
                cls: 'tasks-count',
            });
        }
    }

    private isFilenameUnique({ task }: { task: Task }): boolean | undefined {
        // Will match the filename without extension (the file's "basename").
        const filenameMatch = task.path.match(/([^/]*)\..+$/i);
        if (filenameMatch === null) {
            return undefined;
        }

        const filename = filenameMatch[1];
        const allFilesWithSameName = this.app.vault.getMarkdownFiles().filter((file: TFile) => {
            if (file.basename === filename) {
                // Found a file with the same name (it might actually be the same file, but we'll take that into account later.)
                return true;
            }
        });

        return allFilesWithSameName.length < 2;
    }
}
