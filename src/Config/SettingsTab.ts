import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type TasksPlugin from '../main';
import { Feature } from './Feature';
import { getSettings, isFeatureEnabled, toggleFeature, updateGeneralSetting, updateSettings } from './Settings';
import settingsJson from './settingsConfiguration.json';

export class SettingsTab extends PluginSettingTab {
    customFunctions: { [K: string]: Function } = {
        insertTaskStatusSettings: this.insertTaskStatusSettings,
        insertFeatureFlags: this.insertFeatureFlags,
    };
    private readonly plugin: TasksPlugin;

    constructor({ plugin }: { plugin: TasksPlugin }) {
        super(plugin.app, plugin);

        this.plugin = plugin;
    }

    public display(): void {
        const { containerEl } = this;
        const { headingOpened } = getSettings();

        this.containerEl.empty();
        this.containerEl.addClass('tasks-settings');
        settingsJson.forEach((heading) => {
            const detailsContainer = containerEl.createEl('details', {
                cls: 'tasks-nested-settings',
                attr: {
                    ...(heading.open || headingOpened[heading.text] ? { open: true } : {}),
                },
            });
            detailsContainer.empty();
            detailsContainer.ontoggle = () => {
                headingOpened[heading.text] = detailsContainer.open;
                updateSettings({ headingOpened: headingOpened });
                this.plugin.saveSettings();
            };
            const summary = detailsContainer.createEl('summary');
            new Setting(summary).setHeading().setName(heading.text);
            summary.createDiv('collapser').createDiv('handle');

            // detailsContainer.createEl(heading.level as keyof HTMLElementTagNameMap, { text: heading.text });

            if (heading.notice !== null) {
                const notice = detailsContainer.createEl('div', {
                    cls: heading.notice.class,
                    text: heading.notice.text,
                });
                if (heading.notice.html !== null) {
                    notice.insertAdjacentHTML('beforeend', heading.notice.html);
                }
            }

            heading.settings.forEach((setting) => {
                if (setting.type === 'checkbox') {
                    new Setting(detailsContainer)
                        .setName(setting.name)
                        .setDesc(setting.description)
                        .addToggle((toggle) => {
                            const settings = getSettings();

                            toggle
                                .setValue(<boolean>settings.generalSettings[setting.settingName])
                                .onChange(async (value) => {
                                    updateGeneralSetting(setting.settingName, value);
                                    await this.plugin.saveSettings();
                                });
                        });
                } else if (setting.type === 'text') {
                    new Setting(detailsContainer)
                        .setName(setting.name)
                        .setDesc(setting.description)
                        .addText((text) => {
                            const settings = getSettings();
                            text.setPlaceholder(setting.placeholder.toString())
                                .setValue(settings.generalSettings[setting.settingName].toString())
                                .onChange(async (value) => {
                                    updateGeneralSetting(setting.settingName, value);
                                    await this.plugin.saveSettings();
                                });
                        });
                } else if (setting.type === 'function') {
                    this.customFunctions[setting.settingName](detailsContainer, this);
                }

                if (setting.notice !== null) {
                    const notice = detailsContainer.createEl('p', {
                        cls: setting.notice.class,
                        text: setting.notice.text,
                    });
                    if (setting.notice.html !== null) {
                        notice.insertAdjacentHTML('beforeend', setting.notice.html);
                    }
                }
            });
        });
    }

    insertFeatureFlags(containerEl: HTMLElement, settings: SettingsTab) {
        Feature.values.forEach((feature) => {
            new Setting(containerEl)
                .setName(feature.displayName)
                .setDesc(feature.description + ' Is Stable? ' + feature.stable)
                .addToggle((toggle) => {
                    toggle.setValue(isFeatureEnabled(feature.internalName)).onChange(async (value) => {
                        const updatedFeatures = toggleFeature(feature.internalName, value);
                        updateSettings({ features: updatedFeatures });

                        await settings.plugin.saveSettings();
                        // Force refresh
                        settings.display();
                    });
                });
        });
    }
    insertTaskStatusSettings(containerEl: HTMLElement, settings: SettingsTab) {
        /* -------------------------------------------------------------------------- */
        /*                       Settings for Custom Task Status                      */
        /* -------------------------------------------------------------------------- */
        const { status_types } = getSettings();
        status_types.forEach((status_type) => {
            new Setting(containerEl)
                .addExtraButton((extra) => {
                    extra
                        .setIcon('cross')
                        .setTooltip('Delete')
                        .onClick(async () => {
                            const index = status_types.indexOf(status_type);
                            if (index > -1) {
                                status_types.splice(index, 1);
                                updateSettings({
                                    status_types: status_types,
                                });
                                await settings.plugin.saveSettings();
                                // Force refresh
                                settings.display();
                            }
                        });
                })
                .addText((text) => {
                    const t = text
                        .setPlaceholder('Status symbol')
                        .setValue(status_type[0])
                        .onChange(async (new_symbol) => {
                            // Check to see if they are adding in defaults and block. UI provides this information already.
                            if ([' ', 'x', '-', '/'].includes(new_symbol)) {
                                new Notice(`The symbol ${new_symbol} is already in use.`);
                                updateSettings({
                                    status_types: status_types,
                                });
                                await settings.plugin.saveSettings();
                                // Force refresh
                                settings.display();
                                return;
                            }

                            await this.updateStatusSetting(status_types, status_type, 0, new_symbol);
                        });

                    return t;
                })
                .addText((text) => {
                    const t = text
                        .setPlaceholder('Status name')
                        .setValue(status_type[1])
                        .onChange(async (new_name) => {
                            await this.updateStatusSetting(status_types, status_type, 1, new_name);
                        });
                    return t;
                })
                .addText((text) => {
                    const t = text
                        .setPlaceholder('Next status symbol')
                        .setValue(status_type[2])
                        .onChange(async (new_symbol) => {
                            await this.updateStatusSetting(status_types, status_type, 2, new_symbol);
                        });

                    return t;
                });
        });

        containerEl.createEl('div');

        const setting = new Setting(containerEl).addButton((button) => {
            button
                .setButtonText('Add New Task Status')
                .setCta()
                .onClick(async () => {
                    status_types.push(['', '', '']);
                    updateSettings({
                        status_types: status_types,
                    });
                    await settings.plugin.saveSettings();
                    // Force refresh
                    settings.display();
                });
        });
        setting.infoEl.remove();

        const addStatusesSupportedByMinimalTheme = new Setting(containerEl).addButton((button) => {
            button
                .setButtonText('Add all Status types supported by Minimal Theme')
                .setCta()
                .onClick(async () => {
                    const minimalSupportedStatuses: Array<[string, string, string]> = [
                        ['>', 'Forwarded', 'x'],
                        ['<', 'Schedule', 'x'],
                        ['?', 'Question', 'x'],
                        ['/', 'Incomplete', 'x'],
                        ['!', 'Important', 'x'],
                        ['"', 'Quote', 'x'],
                        ['-', 'Canceled', 'x'],
                        ['*', 'Star', 'x'],
                        ['l', 'Location', 'x'],
                        ['i', 'Info', 'x'],
                        ['S', 'Amount/savings/money', 'x'],
                        ['I', 'Idea/lightbulb', 'x'],
                        ['f', 'Fire', 'x'],
                        ['k', 'Key', 'x'],
                        ['u', 'Up', 'x'],
                        ['d', 'Down', 'x'],
                        ['w', 'Win', 'x'],
                        ['p', 'Pros', 'x'],
                        ['c', 'Cons', 'x'],
                        ['b', 'Bookmark', 'x'],
                    ];

                    minimalSupportedStatuses.forEach((importedStatus) => {
                        console.log(importedStatus);
                        const hasStatus = status_types.find((element) => {
                            return (
                                element[0] == importedStatus[0] &&
                                element[1] == importedStatus[1] &&
                                element[2] == importedStatus[2]
                            );
                        });
                        if (!hasStatus) {
                            status_types.push(importedStatus);
                        } else {
                            new Notice(`The status ${importedStatus[1]} (${importedStatus[0]}) is already added.`);
                        }
                    });

                    updateSettings({
                        status_types: status_types,
                    });
                    await settings.plugin.saveSettings();
                    // Force refresh
                    settings.display();
                });
        });
        addStatusesSupportedByMinimalTheme.infoEl.remove();
    }

    private async updateStatusSetting(
        status_types: [string, string, string][],
        status_type: [string, string, string],
        valueIndex: number,
        newValue: string,
    ) {
        const index = status_types.findIndex((element) => {
            element[0] === status_type[0] && element[1] === status_type[1] && element[2] === status_type[2];
        });

        if (index > -1) {
            status_types[index][valueIndex] = newValue;
            updateSettings({
                status_types: status_types,
            });
            await this.plugin.saveSettings();
        }
    }
}
