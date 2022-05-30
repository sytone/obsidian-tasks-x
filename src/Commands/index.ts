import type TasksPlugin from 'main';
import type { App, Editor, View } from 'obsidian';
import { log } from '../Config/LogConfig';

import { createOrEdit } from './CreateOrEdit';
//import { selectStatus } from './SelectStatus';

import { toggleDone } from './ToggleDone';

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
            editorCheckCallback: (checking: boolean, editor: Editor, view: View) => {
                if (checking) {
                    log('silly', 'Command:debug-export-tasks', 'Checking if command is available.', editor, view);
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
