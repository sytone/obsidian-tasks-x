import {
    EventRef,
    MetadataCache,
    SectionCache,
    TAbstractFile,
    TFile,
    Vault,
} from 'obsidian';
import { Mutex } from 'async-mutex';
import { Connection, DATA_TYPE, IDataBase, ITable } from 'jsstore';
import workerInjector from 'jsstore/dist/worker_injector';

import { Task, TaskRecord } from './Task';
import type { Events } from './Events';
import { isFeatureEnabled } from './config/Settings';
import { Feature } from './config/Feature';
import { rootDataStore } from './config/LogConfig';

export enum State {
    Cold = 'Cold',
    Initializing = 'Initializing',
    Warm = 'Warm',
}

export class Cache {
    private readonly metadataCache: MetadataCache;
    private readonly metadataCacheEventReferences: EventRef[];
    private readonly vault: Vault;
    private readonly vaultEventReferences: EventRef[];
    private readonly events: Events;
    private readonly eventsEventReferences: EventRef[];

    private readonly tasksMutex: Mutex;
    private state: State;
    private _tasks: Task[];
    idbConnection = new Connection();

    databaseName = 'TasksX';

    /**
     * We cannot know if this class will be instantiated because obsidian started
     * or because the plugin was activated later. This means we have to load the
     * whole vault once after the first metadata cache resolve to ensure that we
     * load the entire vault in case obsidian is starting up. In the case of
     * obsidian starting, the task cache's initial load would end up with 0 tasks,
     * as the metadata cache would still be empty.
     */
    private loadedAfterFirstResolve: boolean;

    log = rootDataStore.getChildCategory('Cache');

    constructor({
        metadataCache,
        vault,
        events,
    }: {
        metadataCache: MetadataCache;
        vault: Vault;
        events: Events;
    }) {
        this.idbConnection.addPlugin(workerInjector);

        this.metadataCache = metadataCache;
        this.metadataCacheEventReferences = [];
        this.vault = vault;
        this.vaultEventReferences = [];
        this.events = events;
        this.eventsEventReferences = [];

        this.tasksMutex = new Mutex();
        this.state = State.Cold;
        this._tasks = [];

        this.loadedAfterFirstResolve = false;

        if (isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)) {
            this.log.info(
                'ENABLE_DB_STORE is enabled using IndexedDB backing store',
            );

            try {
                const dataBase = this.getDatabaseSchema();
                this.log.info('Creating database', dataBase);
                //debugger;
                this.idbConnection.initDb(dataBase).then((completed) => {
                    this.log.info('Initialized Database', completed);
                });
            } catch (ex) {
                this.log.error('Unable to initialize IndexedDB', ex);
            }
        }

        this.subscribeToCache();
        this.subscribeToVault();
        this.subscribeToEvents();

        this.loadVault();
    }

    public unload(): void {
        for (const eventReference of this.metadataCacheEventReferences) {
            this.metadataCache.offref(eventReference);
        }

        for (const eventReference of this.vaultEventReferences) {
            this.vault.offref(eventReference);
        }

        for (const eventReference of this.eventsEventReferences) {
            this.events.off(eventReference);
        }
    }

    public getTasks(): Task[] {
        if (isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)) {
            this.idbConnection
                .select<TaskRecord>({
                    from: 'Tasks',
                })
                .then((tasks) => {
                    this._tasks = tasks.map((taskRecord) => {
                        return Task.fromTaskRecord(taskRecord);
                    });
                });
        }
        return this._tasks;
    }

    public getState(): State {
        return this.state;
    }

    private getDatabaseSchema = () => {
        const tblTasks: ITable = {
            name: 'Tasks',
            columns: {
                id: {
                    primaryKey: true,
                    autoIncrement: true,
                },
                status: {
                    notNull: true,
                    dataType: DATA_TYPE.Object,
                },
                description: {
                    notNull: true,
                    dataType: DATA_TYPE.String,
                },
                path: {
                    notNull: true,
                    dataType: DATA_TYPE.String,
                },
                indentation: {
                    notNull: true,
                    dataType: DATA_TYPE.String,
                },
                sectionStart: {
                    notNull: true,
                    dataType: DATA_TYPE.Number,
                },
                sectionIndex: {
                    notNull: true,
                    dataType: DATA_TYPE.Number,
                },
                precedingHeader: {
                    notNull: true,
                    dataType: DATA_TYPE.String,
                },
                tags: {
                    notNull: true,
                    dataType: DATA_TYPE.Array,
                },
                blockLink: {
                    dataType: DATA_TYPE.String,
                },
                priority: {
                    dataType: DATA_TYPE.String,
                    notNull: true,
                },
                startDate: {
                    dataType: DATA_TYPE.DateTime,
                },
                scheduledDate: {
                    dataType: DATA_TYPE.DateTime,
                },
                dueDate: {
                    dataType: DATA_TYPE.DateTime,
                },
                createdDate: {
                    dataType: DATA_TYPE.DateTime,
                },
                doneDate: {
                    dataType: DATA_TYPE.DateTime,
                },
                recurrence: {
                    dataType: DATA_TYPE.Object,
                },
            },
        };
        const dataBase: IDataBase = {
            name: this.databaseName,
            tables: [tblTasks],
        };
        return dataBase;
    };

    private notifySubscribers() {
        this.events.triggerCacheUpdate({
            tasks: this.getTasks(),
            state: this.state,
        });
    }

    private subscribeToCache(): void {
        const resolvedEventReference = this.metadataCache.on(
            'resolved',
            async () => {
                this.log.debug(
                    `resolved event received, loadedAfterFirstResolve: ${this.loadedAfterFirstResolve}`,
                );
                // Resolved fires on every change.
                // We only want to initialize if we haven't already.
                if (!this.loadedAfterFirstResolve) {
                    this.loadedAfterFirstResolve = true;
                    this.loadVault();
                }
            },
        );
        this.metadataCacheEventReferences.push(resolvedEventReference);

        // Does not fire when starting up obsidian and only works for changes.
        const changedEventReference = this.metadataCache.on(
            'changed',
            (file: TFile) => {
                this.tasksMutex.runExclusive(() => {
                    this.log.debug(
                        `changed event received, file: ${file.path}`,
                    );
                    this.indexFile(file);
                });
            },
        );
        this.metadataCacheEventReferences.push(changedEventReference);
    }

    private subscribeToVault(): void {
        const createdEventReference = this.vault.on(
            'create',
            (file: TAbstractFile) => {
                this.log.debug(`create event received, file: ${file.path}`);
                if (!(file instanceof TFile)) {
                    return;
                }

                this.tasksMutex.runExclusive(() => {
                    this.indexFile(file);
                });
            },
        );
        this.vaultEventReferences.push(createdEventReference);

        const deletedEventReference = this.vault.on(
            'delete',
            (file: TAbstractFile) => {
                this.log.debug(`delete event received, file: ${file.path}`);

                if (!(file instanceof TFile)) {
                    return;
                }

                this.tasksMutex.runExclusive(async () => {
                    if (
                        isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)
                    ) {
                        this.log.debug(
                            `Removing ${file.path} tasks from 'Tasks'`,
                        );
                        await this.idbConnection.remove({
                            from: 'Tasks',
                            where: {
                                path: file.path,
                            },
                        });
                    } else {
                        this._tasks = this._tasks.filter((task: Task) => {
                            return task.path !== file.path;
                        });
                    }

                    this.notifySubscribers();
                });
            },
        );
        this.vaultEventReferences.push(deletedEventReference);

        const renamedEventReference = this.vault.on(
            'rename',
            (file: TAbstractFile, oldPath: string) => {
                this.log.debug(`rename event received, file: ${file.path}`);
                if (!(file instanceof TFile)) {
                    return;
                }

                this.tasksMutex.runExclusive(async () => {
                    if (
                        isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)
                    ) {
                        this.log.debug(
                            `Updating ${oldPath} to ${file.path} in 'Tasks'`,
                        );
                        await this.idbConnection.update({
                            in: 'Tasks',
                            set: {
                                path: file.path,
                            },
                            where: {
                                path: oldPath,
                            },
                        });
                    } else {
                        this._tasks = this._tasks.map((task: Task): Task => {
                            if (task.path === oldPath) {
                                return new Task({ ...task, path: file.path });
                            } else {
                                return task;
                            }
                        });
                    }

                    this.notifySubscribers();
                });
            },
        );
        this.vaultEventReferences.push(renamedEventReference);
    }

    private subscribeToEvents(): void {
        const requestReference = this.events.onRequestCacheUpdate((handler) => {
            handler({ tasks: this.getTasks(), state: this.state });
        });
        this.eventsEventReferences.push(requestReference);
    }

    private loadVault(): Promise<void> {
        return this.tasksMutex.runExclusive(async () => {
            this.state = State.Initializing;
            await Promise.all(
                this.vault.getMarkdownFiles().map((file: TFile) => {
                    return this.indexFile(file);
                }),
            );
            this.state = State.Warm;
            // Notify that the cache is now warm:
            this.notifySubscribers();
        });
    }

    private async indexFile(file: TFile): Promise<void> {
        const fileCache = this.metadataCache.getFileCache(file);
        if (fileCache === null || fileCache === undefined) {
            return;
        }

        let listItems = fileCache.listItems;
        if (listItems === undefined) {
            // When there is no list items cache, there are no tasks.
            // Still continue to notify watchers of removal.
            listItems = [];
        }

        const fileContent = await this.vault.cachedRead(file);
        const fileLines = fileContent.split('\n');

        // Remove all tasks from this file from the cache before
        // adding the ones that are currently in the file.

        if (isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)) {
            this.log.trace(`Removing ${file.path} tasks from 'Tasks'`);
            await this.idbConnection.remove({
                from: 'Tasks',
                where: {
                    path: file.path,
                },
            });
        } else {
            this._tasks = this._tasks.filter((task: Task) => {
                return task.path !== file.path;
            });
        }

        // We want to store section information with every task so
        // that we can use that when we post process the markdown
        // rendered lists.
        let currentSection: SectionCache | null = null;
        let sectionIndex = 0;
        for (const listItem of listItems) {
            if (listItem.task !== undefined) {
                if (
                    currentSection === null ||
                    currentSection.position.end.line <
                        listItem.position.start.line
                ) {
                    // We went past the current section (or this is the first task).
                    // Find the section that is relevant for this task and the following of the same section.
                    currentSection = this.getSection({
                        lineNumberTask: listItem.position.start.line,
                        sections: fileCache.sections,
                    });
                    sectionIndex = 0;
                }

                if (currentSection === null) {
                    // Cannot process a task without a section.
                    continue;
                }

                const line = fileLines[listItem.position.start.line];
                const task = Task.fromLine({
                    line,
                    path: file.path,
                    sectionStart: currentSection.position.start.line,
                    sectionIndex,
                    precedingHeader: this.getPrecedingHeader({
                        lineNumberTask: listItem.position.start.line,
                        sections: fileCache.sections,
                        fileLines,
                    }),
                });

                if (task !== null) {
                    sectionIndex++;
                    if (
                        isFeatureEnabled(Feature.ENABLE_DB_STORE.internalName)
                    ) {
                        this.log.trace(
                            `Inserting ${task.description} into 'Tasks'`,
                            task.toValueTable(),
                        );
                        await this.idbConnection.insert({
                            into: 'Tasks',
                            values: [task.toValueTable()],
                        });
                    } else {
                        this._tasks.push(task);
                    }
                }
            }
        }

        // All updated, inform our subscribers.
        this.notifySubscribers();
    }

    private getSection({
        lineNumberTask,
        sections,
    }: {
        lineNumberTask: number;
        sections: SectionCache[] | undefined;
    }): SectionCache | null {
        if (sections === undefined) {
            return null;
        }

        for (const section of sections) {
            if (
                section.type === 'list' &&
                section.position.start.line <= lineNumberTask &&
                section.position.end.line >= lineNumberTask
            ) {
                return section;
            }
        }

        return null;
    }

    private getPrecedingHeader({
        lineNumberTask,
        sections,
        fileLines,
    }: {
        lineNumberTask: number;
        sections: SectionCache[] | undefined;
        fileLines: string[];
    }): string | null {
        if (sections === undefined) {
            return null;
        }

        let precedingHeaderSection: SectionCache | undefined;
        for (const section of sections) {
            if (section.type === 'heading') {
                if (section.position.start.line > lineNumberTask) {
                    // Break out of the loop as the last header was the preceding one.
                    break;
                }
                precedingHeaderSection = section;
            }
        }
        if (precedingHeaderSection === undefined) {
            return null;
        }

        const lineNumberPrecedingHeader =
            precedingHeaderSection.position.start.line;

        const linePrecedingHeader = fileLines[lineNumberPrecedingHeader];

        const headerRegex = /^#+ +(.*)/u;
        const headerMatch = linePrecedingHeader.match(headerRegex);
        if (headerMatch === null) {
            return null;
        } else {
            return headerMatch[1];
        }
    }
}
