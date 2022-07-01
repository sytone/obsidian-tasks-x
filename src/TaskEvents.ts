import type { App } from 'obsidian';

import type { Task } from './Task';
import { replaceTaskWithTasks } from './File';
import type { TaskRenderer } from './TaskRenderer';
import { TaskModal } from './TaskModal';

/**
 * This class handles the interaction with the events wired up to the
 * rendered task being returned from the queries.
 * This is done to separate the svelte code out to allow unit testing
 * of the rendering logic.
 *
 * @export
 * @class TaskEvents
 */
export class TaskEvents {
    /**
     * Creates a instance of the task renderer to be used in rendering the output of a SQL based query.
     */
    constructor(public app: App, public taskRenderer: TaskRenderer) {}

    public async getRenderedHTMLWithEvents(
        parentUlElement: HTMLElement,
        index: number,
        task: Task,
    ): Promise<HTMLElement> {
        const renderedHtml = await this.taskRenderer.toHTMLElement(parentUlElement, index, task);

        const input = <HTMLInputElement>renderedHtml.querySelector('input');
        if (input !== null) {
            input.onClickEvent((event: MouseEvent) => {
                event.preventDefault();
                // It is required to stop propagation so that obsidian won't write the file with the
                // checkbox (un)checked. Obsidian would write after us and overwrite our change.
                event.stopPropagation();

                // Should be re-rendered as enabled after update in file.
                input.disabled = true;
                const toggledTasks = task.toggle();
                replaceTaskWithTasks({
                    originalTask: task,
                    newTasks: toggledTasks,
                });
            });
        }

        const edit = <HTMLInputElement>renderedHtml.querySelector('.tasks-edit');
        if (edit !== null) {
            edit.onClickEvent((event: MouseEvent) => {
                event.preventDefault();

                const onSubmit = (updatedTasks: Task[]): void => {
                    replaceTaskWithTasks({
                        originalTask: task,
                        newTasks: updatedTasks,
                    });
                };

                // Need to create a new instance every time, as cursor/task can change.
                const taskModal = new TaskModal({
                    app: this.app,
                    task,
                    onSubmit,
                });
                taskModal.open();
            });
        }

        return renderedHtml as HTMLElement;
    }
}
