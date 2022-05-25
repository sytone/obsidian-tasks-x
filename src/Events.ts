import type { EventRef, Events as ObsidianEvents } from 'obsidian';
import { rootMain } from './config/LogConfig';

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

export class Events {
    private obsidianEvents: ObsidianEvents;
    log = rootMain.getChildCategory('Events');

    constructor({ obsidianEvents }: { obsidianEvents: ObsidianEvents }) {
        this.obsidianEvents = obsidianEvents;
    }

    public onCacheUpdate(handler: (cacheData: CacheUpdateData) => void): EventRef {
        this.log.debug(`onCacheUpdate event "${Event.CacheUpdate}"`);
        return this.obsidianEvents.on(Event.CacheUpdate, handler);
    }

    public triggerCacheUpdate(cacheData: CacheUpdateData): void {
        this.log.debug(`triggerCacheUpdate event "${Event.CacheUpdate}"`);
        this.obsidianEvents.trigger(Event.CacheUpdate, cacheData);
    }

    public onRequestCacheUpdate(handler: (fn: (cacheData: CacheUpdateData) => void) => void): EventRef {
        this.log.debug(`onRequestCacheUpdate event "${Event.RequestCacheUpdate}"`);
        return this.obsidianEvents.on(Event.RequestCacheUpdate, handler);
    }

    public triggerRequestCacheUpdate(fn: (cacheData: CacheUpdateData) => void): void {
        this.log.debug(`triggerRequestCacheUpdate event "${Event.RequestCacheUpdate}"`);
        this.obsidianEvents.trigger(Event.RequestCacheUpdate, fn);
    }

    public off(eventRef: EventRef): void {
        this.log.debug(`off event "${eventRef}"`);
        this.obsidianEvents.offref(eventRef);
    }
}
