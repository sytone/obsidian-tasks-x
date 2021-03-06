import { EventRef, MetadataCache, SectionCache, TAbstractFile, TFile, Vault } from 'obsidian';
import { Mutex } from 'async-mutex';

import { Task } from './Task';
import type { TasksEvents } from './TasksEvents';

import { log } from './Config/../lib/logging';

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
    private readonly events: TasksEvents;
    private readonly eventsEventReferences: EventRef[];

    private readonly tasksMutex: Mutex;
    private readonly vaultLoadMutex: Mutex;

    private state: State;
    private _tasks: Task[];
    private _files: [string, number][];

    /**
     * We cannot know if this class will be instantiated because obsidian started
     * or because the plugin was activated later. This means we have to load the
     * whole vault once after the first metadata cache resolve to ensure that we
     * load the entire vault in case obsidian is starting up. In the case of
     * obsidian starting, the task cache's initial load would end up with 0 tasks,
     * as the metadata cache would still be empty.
     */
    private loadedAfterFirstResolve: boolean;

    constructor({ metadataCache, vault, events }: { metadataCache: MetadataCache; vault: Vault; events: TasksEvents }) {
        this.metadataCache = metadataCache;
        this.metadataCacheEventReferences = [];
        this.vault = vault;
        this.vaultEventReferences = [];
        this.events = events;
        this.eventsEventReferences = [];

        this.tasksMutex = new Mutex();
        this.vaultLoadMutex = new Mutex();
        this.state = State.Cold;
        this._tasks = [];
        this._files = [];

        this.loadedAfterFirstResolve = false;

        this.subscribeToCache();
        this.subscribeToVault();
        this.subscribeToEvents();

        this.vaultLoadMutex.runExclusive(() => {
            this.loadVault();
        });
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
        return this._tasks;
    }

    public getState(): State {
        return this.state;
    }

    private notifySubscribers() {
        if (this.state === State.Warm) {
            this.events.triggerCacheUpdate({
                tasks: this.getTasks(),
                state: this.state,
            });
        }
    }

    private subscribeToCache(): void {
        const resolvedEventReference = this.metadataCache.on('resolved', async () => {
            log('debug', `resolved event received, loadedAfterFirstResolve: ${this.loadedAfterFirstResolve}`);
            // Resolved fires on every change.
            // We only want to initialize if we haven't already.

            this.vaultLoadMutex.runExclusive(() => {
                if (!this.loadedAfterFirstResolve && this.state !== State.Warm && this.state !== State.Initializing) {
                    this.loadedAfterFirstResolve = true;
                    this.loadVault();
                }
            });
        });
        this.metadataCacheEventReferences.push(resolvedEventReference);

        // Does not fire when starting up obsidian and only works for changes.
        const changedEventReference = this.metadataCache.on('changed', (file: TFile) => {
            this.tasksMutex.runExclusive(() => {
                if (this.state === State.Warm) {
                    log('debug', `changed event received, file: ${file.path}`);
                    this.indexFile(file);
                }
            });
        });
        this.metadataCacheEventReferences.push(changedEventReference);
    }

    private subscribeToVault(): void {
        const createdEventReference = this.vault.on('create', (file: TAbstractFile) => {
            log('debug', `create event received, file: ${file.path}`);
            if (!(file instanceof TFile)) {
                return;
            }

            this.tasksMutex.runExclusive(() => {
                if (this.state === State.Warm) {
                    this.indexFile(file);
                }
            });
        });
        this.vaultEventReferences.push(createdEventReference);

        const deletedEventReference = this.vault.on('delete', (file: TAbstractFile) => {
            log('debug', `delete event received, file: ${file.path}`);

            if (!(file instanceof TFile)) {
                return;
            }

            this.tasksMutex.runExclusive(async () => {
                if (this.state === State.Warm) {
                    this._tasks = this._tasks.filter((task: Task) => {
                        return task.path !== file.path;
                    });

                    this.notifySubscribers();
                }
            });
        });
        this.vaultEventReferences.push(deletedEventReference);

        const renamedEventReference = this.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
            log('debug', `rename event received, file: ${file.path}`);
            if (!(file instanceof TFile)) {
                return;
            }

            this.tasksMutex.runExclusive(async () => {
                if (this.state === State.Warm) {
                    this._tasks = this._tasks.map((task: Task): Task => {
                        if (task.path === oldPath) {
                            return new Task({ ...task, path: file.path });
                        } else {
                            return task;
                        }
                    });

                    this.notifySubscribers();
                }
            });
        });
        this.vaultEventReferences.push(renamedEventReference);
    }

    private subscribeToEvents(): void {
        const requestReference = this.events.onRequestCacheUpdate((handler) => {
            log('debug', `onRequestCacheUpdate, this.getTasks(): ${this.getTasks().length}, state: ${this.state}`);

            handler({ tasks: this.getTasks(), state: this.state });
        });
        this.eventsEventReferences.push(requestReference);
    }

    private async loadVault() {
        this.state = State.Initializing;
        await Promise.all(
            this.vault.getMarkdownFiles().map((file: TFile) => {
                return this.indexFile(file);
            }),
        );

        this.state = State.Warm;
        log('info', `Loaded ${this.getTasks().length} tasks`);
        // Notify that the cache is now warm:
        this.notifySubscribers();
    }

    private async indexFile(file: TFile): Promise<void> {
        const fileCache = this.metadataCache.getFileCache(file);
        if (fileCache === null || fileCache === undefined) {
            return;
        }

        // Remove all tasks from this file from the cache before
        // adding the ones that are currently in the file.
        this._tasks = this._tasks.filter((task: Task) => {
            return task.path !== file.path;
        });

        let listItems = fileCache.listItems;
        if (listItems === undefined) {
            listItems = [];
            // When there is no list items cache, there are no tasks.
            // Still continue to notify watchers of potential removal.
            if (this.state === State.Warm) {
                this.notifySubscribers();
            }
            return;
        }

        // If we are initalizing, only touch the file once.
        let pathFound = false;
        for (let i = 0; i < this._files.length; i++) {
            if (this._files[i][0] === file.path) {
                pathFound = true;
            }
        }
        if (this.state === State.Initializing && pathFound) {
            return;
        }
        if (!pathFound) {
            // log(
            //     'silly',
            //     'indexFile',
            //     `${this.state}: indexed file: ${file.path} with ${fileCache?.listItems?.length} tasks`,
            // );
            this._files.push([file.path, Date.now()]);
        }

        const fileContent = await this.vault.cachedRead(file);
        const fileLines = fileContent.split('\n');

        // We want to store section information with every task so
        // that we can use that when we post process the markdown
        // rendered lists.
        let currentSection: SectionCache | null = null;
        let sectionIndex = 0;
        for (const listItem of listItems) {
            if (listItem.task !== undefined) {
                if (currentSection === null || currentSection.position.end.line < listItem.position.start.line) {
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
                    file,
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

                    this._tasks.push(task);
                }
            }
        }

        // All updated, inform our subscribers.
        if (this.state === State.Warm) {
            this.notifySubscribers();
        }
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

        const lineNumberPrecedingHeader = precedingHeaderSection.position.start.line;

        const linePrecedingHeader = fileLines[lineNumberPrecedingHeader];

        // Use the index and slice as it is faster than the regex calls by a few ms.
        if (linePrecedingHeader.indexOf('#') === 0) {
            return linePrecedingHeader.slice(linePrecedingHeader.split(' ')[0].length);
        }
        return null;

        // const headerRegex = /^#+ +(.*)/u;
        // const headerMatch = linePrecedingHeader.match(headerRegex);

        // if (headerMatch === null) {
        //     return null;
        // } else {
        //     return headerMatch[1];
        // }
    }
}
