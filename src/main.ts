import { Plugin } from 'obsidian';
import { Status } from './Status';

import { Cache } from './Cache';
import { Commands } from './Commands';
import { Events } from './Events';
import { initializeFile } from './File';
import { InlineRenderer } from './InlineRenderer';
import { newLivePreviewExtension } from './LivePreviewExtension';
import { QueryRenderer } from './Query/QueryRenderer';
import { getSettings, updateSettings } from './Config/Settings';
import { SettingsTab } from './Config/SettingsTab';
import { StatusRegistry } from './StatusRegistry';
import { log, logCallDetails } from './Config/LogConfig';
//import { rootMain } from './config/LogConfig';

export default class TasksPlugin extends Plugin {
    public inlineRenderer: InlineRenderer | undefined;
    public queryRenderer: QueryRenderer | undefined;
    public statusRegistry: StatusRegistry | undefined;
    //log = rootMain.getChildCategory('TasksPlugin');
    private cache: Cache | undefined;

    @logCallDetails()
    async onload(): Promise<void> {
        log('info', `loading plugin "${this.manifest.name}" v${this.manifest.version}`);

        // Load the settings and UI.
        await this.loadSettings();
        this.addSettingTab(new SettingsTab({ plugin: this }));

        /**
         * Fire the initial indexing only if layoutReady = true
         * avoids trying to create an index while obsidian is indexing files
         */
        this.app.workspace.onLayoutReady(async () => {
            log('info', `Layout is ready for workspace: ${this.app.vault.getName()}`);
            initializeFile({
                metadataCache: this.app.metadataCache,
                vault: this.app.vault,
            });

            const events = new Events({ obsidianEvents: this.app.workspace });
            this.cache = new Cache({
                metadataCache: this.app.metadataCache,
                vault: this.app.vault,
                events,
            });
            this.inlineRenderer = new InlineRenderer({ plugin: this });
            this.queryRenderer = new QueryRenderer({ plugin: this, events });
            this.statusRegistry = StatusRegistry.getInstance();

            await this.loadTaskStatuses();

            this.registerEditorExtension(newLivePreviewExtension());
            new Commands({ plugin: this });
        });
    }

    async loadTaskStatuses() {
        const { status_types } = getSettings();

        // Reset the registry as this may also come from a settings add/delete.
        this.statusRegistry?.clearStatuses();

        status_types.forEach((status_type) => {
            log(
                'info',
                `${this.manifest.name}: Adding custom status - [${status_type[0]}] ${status_type[1]} -> ${status_type[2]} `,
            );
            this.statusRegistry?.add(new Status(status_type[0], status_type[1], status_type[2]));
        });
    }

    onunload() {
        log('info', `unloading plugin "${this.manifest.name}" v${this.manifest.version}`);
        this.cache?.unload();
    }

    async loadSettings() {
        const newSettings = await this.loadData();
        updateSettings(newSettings);
    }

    async saveSettings() {
        await this.saveData(getSettings());
        await this.loadTaskStatuses();
    }
}
