import type TasksPlugin from 'main';
import type { App, Editor, View } from 'obsidian';

import { getSettings } from '../config/Settings';
import { createOrEdit } from './CreateOrEdit';
import { toggleDone } from './ToggleDone';
import { toggleStatus } from './ToggleStatus';

export class Commands {
    private readonly plugin: TasksPlugin;

    constructor({ plugin }: { plugin: TasksPlugin }) {
        this.plugin = plugin;

        plugin.addCommand({
            id: 'edit-task',
            name: 'Create or edit task',
            icon: 'pencil',
            editorCheckCallback: (checking: boolean, editor: Editor, view: View) => {
                return createOrEdit(checking, editor, view, this.app);
            },
        });

        plugin.addCommand({
            id: 'toggle-done',
            name: 'Toggle task done',
            icon: 'check-in-circle',
            editorCheckCallback: toggleDone,
        });

        const { statusTypes } = getSettings();
        statusTypes.forEach((statusType) => {
            if (statusType.availableAsCommand) {
                plugin.addCommand({
                    id: 'tasks-status-set-' + statusType.indicator,
                    name: 'Set task status to ' + statusType.name,
                    icon: 'check-in-circle',
                    editorCheckCallback: (checking: boolean, editor: Editor, view: View) => {
                        return toggleStatus(statusType, checking, editor, view);
                    },
                });
            }
        });

        // plugin.addCommand({
        //     id: 'select-status-modal',
        //     name: 'Select Status',
        //     icon: 'check-in-circle',
        //     editorCheckCallback: selectStatus,
        // });

        plugin.addCommand({
            id: 'debug-export-tasks',
            name: 'Debug: Export tasks to console log',
            icon: 'pencil',
            editorCheckCallback: (checking: boolean, _editor: Editor, _view: View) => {
                if (checking) {
                    return true;
                }
                this.plugin.cache?.getTasks().forEach((task) => {
                    console.log(task.toString());
                });
            },
        });
    }

    private get app(): App {
        return this.plugin.app;
    }
}
