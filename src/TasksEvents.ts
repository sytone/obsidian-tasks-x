import type { EventRef, Events as ObsidianEvents } from 'obsidian';
import { log } from './config/LogConfig';

import type { State } from './Cache';
import type { Task } from './Task';

enum Event {
    CacheUpdate = 'obsidian-tasks-x-plugin:cache-update',
    RequestCacheUpdate = 'obsidian-tasks-x-plugin:request-cache-update',
}

interface CacheUpdateData {
    tasks: Task[];
    state: State;
}

export class TasksEvents {
    private obsidianEvents: ObsidianEvents;

    constructor({ obsidianEvents }: { obsidianEvents: ObsidianEvents }) {
        this.obsidianEvents = obsidianEvents;
    }

    public onCacheUpdate(handler: (cacheData: CacheUpdateData) => void): EventRef {
        log('debug', `onCacheUpdate event "${Event.CacheUpdate}"`);
        return this.obsidianEvents.on(Event.CacheUpdate, handler);
    }

    public triggerCacheUpdate(cacheData: CacheUpdateData): void {
        log('debug', `triggerCacheUpdate event "${Event.CacheUpdate}"`);
        this.obsidianEvents.trigger(Event.CacheUpdate, cacheData);
    }

    public onRequestCacheUpdate(handler: (fn: (cacheData: CacheUpdateData) => void) => void): EventRef {
        log('debug', `onRequestCacheUpdate event "${Event.RequestCacheUpdate}"`);
        return this.obsidianEvents.on(Event.RequestCacheUpdate, handler);
    }

    public triggerRequestCacheUpdate(fn: (cacheData: CacheUpdateData) => void): void {
        log('debug', `triggerRequestCacheUpdate event "${Event.RequestCacheUpdate}"`);
        this.obsidianEvents.trigger(Event.RequestCacheUpdate, fn);
    }

    public off(eventRef: EventRef): void {
        this.obsidianEvents.offref(eventRef);
    }
}
