import type { App } from 'obsidian';

/**
 * This contains all the services used by the plugin. They are stored here and not
 * in the min file to reduce the dependencies being pulled in. There were
 * issues with the ui files being references when the TasksPlugin was
 * used to store this.
 *
 * @export
 * @class TasksServices
 */
export default class TasksServices {
    public static obsidianApp: App;
}
