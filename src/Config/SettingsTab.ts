import { Notice, PluginSettingTab, Setting } from 'obsidian';
import type TasksPlugin from '../main';
import { log } from './../lib/logging';
import { Feature } from './Feature';
import { getSettings, isFeatureEnabled, toggleFeature, updateGeneralSetting, updateSettings } from './Settings';
import settingsJson from './settingsConfiguration.json';

import { CustomStatusModal } from './CustomStatusModal';

export class SettingsTab extends PluginSettingTab {
    // If the UI needs a more complex setting you can create a
    // custom function and specifiy it from the json file. It will
    // then be rendered instead of a normal checkbox or text box.
    customFunctions: { [K: string]: Function } = {
        insertTaskStatusSettings: this.insertTaskStatusSettings,
        insertFeatureFlags: this.insertFeatureFlags,
    };

    private readonly plugin: TasksPlugin;

    constructor({ plugin }: { plugin: TasksPlugin }) {
        super(plugin.app, plugin);

        this.plugin = plugin;
    }

    public async saveSettings(update?: boolean): Promise<void> {
        log('debug', `Saving settings with update: ${update}`);

        await this.plugin.saveSettings();

        if (update) {
            this.display();
        }
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

            // This will process all the settings from settingsConfiguration.json and render
            // them out reducing the duplication of the code in this file. This will become
            // more important as features are being added over time.
            heading.settings.forEach((setting) => {
                if (setting.featureFlag !== '' && !isFeatureEnabled(setting.featureFlag)) {
                    // The settings configuration has a featureFlag set and the user has not
                    // enabled it. Skip adding the settings option.
                    return;
                }
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

    /**
     * This renders the Features section of the settings tab. As it is more
     * complex it has a function spcefied from the json file.
     *
     * @param {HTMLElement} containerEl
     * @param {SettingsTab} settings
     * @memberof SettingsTab
     */
    insertFeatureFlags(containerEl: HTMLElement, settings: SettingsTab) {
        Feature.values.forEach((feature) => {
            new Setting(containerEl)
                .setName(feature.displayName)
                .setDesc(feature.description + ' Is Stable? ' + feature.stable)
                .addToggle((toggle) => {
                    toggle.setValue(isFeatureEnabled(feature.internalName)).onChange(async (value) => {
                        const updatedFeatures = toggleFeature(feature.internalName, value);
                        updateSettings({ features: updatedFeatures });

                        await settings.saveSettings(true);
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
            //const taskStatusDiv = containerEl.createEl('div');

            const taskStatusPreview = containerEl.createEl('pre');
            taskStatusPreview.textContent = `- [${status_type[0]}] ${status_type[1]}, next status is '${status_type[2]}'`;

            const setting = new Setting(containerEl);

            setting.infoEl.replaceWith(taskStatusPreview);

            setting
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

                                await settings.saveSettings(true);
                            }
                        });
                })

                .addExtraButton((extra) => {
                    extra
                        .setIcon('pencil')
                        .setTooltip('Edit')
                        .onClick(async () => {
                            const modal = new CustomStatusModal(settings.plugin, status_type);

                            modal.onClose = async () => {
                                if (modal.saved) {
                                    const index = status_types.indexOf(status_type);
                                    if (index > -1) {
                                        status_types.splice(index, 1, [
                                            modal.statusSymbol,
                                            modal.statusName,
                                            modal.statusNextSymbol,
                                        ]);
                                        updateSettings({
                                            status_types: status_types,
                                        });

                                        await settings.saveSettings(true);
                                    }
                                }
                            };

                            modal.open();
                        });
                });

            setting.infoEl.remove();
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

                    await settings.saveSettings(true);
                });
        });
        setting.infoEl.remove();

        /* -------------------- Minimal Theme Supported Status Types -------------------- */
        const addStatusesSupportedByMinimalTheme = new Setting(containerEl).addButton((button) => {
            button
                .setButtonText('Add all Status types supported by Minimal Theme')
                .setCta()
                .onClick(async () => {
                    const minimalSupportedStatuses: Array<[string, string, string]> = [
                        ['>', 'Forwarded', 'x'],
                        ['<', 'Schedule', 'x'],
                        ['?', 'Question', 'x'],
                        // ['/', 'Incomplete', 'x'], This is used for In Progress
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

                    await settings.saveSettings(true);
                });
        });
        addStatusesSupportedByMinimalTheme.infoEl.remove();

        /* -------------------- ITS Theme Supported Status Types -------------------- */
        const addStatusesSupportedByITSTheme = new Setting(containerEl).addButton((button) => {
            button
                .setButtonText('Add all Status types supported by ITS Theme')
                .setCta()
                .onClick(async () => {
                    const supportedStatuses: Array<[string, string, string]> = [
                        //['X', 'Checked', 'x'],
                        ['>', 'Forward', 'x'],
                        ['D', 'Deferred/Scheduled', 'x'],
                        //['-', 'Cancelled/Non-Task', 'x'],
                        ['?', 'Question', 'x'],
                        ['!', 'Important', 'x'],
                        ['+', 'Add', 'x'],
                        //['/', 'Half Done', 'x'],
                        ['R', 'Research', 'x'],
                        ['i', 'Idea', 'x'],
                        ['B', 'Brainstorm', 'x'],
                        ['P', 'Pro', 'x'],
                        ['C', 'Con', 'x'],
                        ['I', 'Info', 'x'],
                        ['Q', 'Quote', 'x'],
                        ['N', 'Note', 'x'],
                        ['b', 'Bookmark', 'x'],
                        ['p', 'Paraphrase', 'x'],
                        ['E', 'Example', 'x'],
                        ['L', 'Location', 'x'],
                        ['A', 'Answer', 'x'],
                        ['r', 'Reward', 'x'],
                        ['c', 'Choice', 'x'],
                    ];

                    supportedStatuses.forEach((importedStatus) => {
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

                    await settings.saveSettings(true);
                });
        });
        addStatusesSupportedByITSTheme.infoEl.remove();
    }
}
