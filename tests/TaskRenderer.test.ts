/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { TaskRenderer } from '../src/TaskRenderer';
import { TaskBuilder } from './TestingTools/TaskBuilder';

jest.mock('obsidian');
window.moment = moment;

describe('moment block helper', () => {
    it('parses a task duedate value to format', () => {
        const r = new TaskRenderer('{{moment task.dueDate format="YYYY-MM-DD HH:mm:ss"}}');
        const task = new TaskBuilder().dueDate(moment('2022-02-02 14:34:23')).build();

        expect(r.toRenderedString(task)).toBe('2022-02-02 14:34:23');
    });
});

describe('Html Element', () => {
    it('handles default template', () => {
        const r = new TaskRenderer();
        const task = new TaskBuilder().dueDate(moment('2022-02-02 14:34:23')).build();
        expect(r.toRenderedString(task)).toBe(
            '<li data-line="1" data-task="" class="task-list-item plugin-tasks-list-item"><input data-line="1" type="checkbox" class="task-list-item-checkbox"><span class="tasks-list-text">my description  📅 2022-02-02 </span><a class="tasks-edit"></a></li>',
        );
    });

    // it('handles default template with links in description', async () => {
    //     document.body.innerHTML = '<html></html>';
    //     console.log(JSON.stringify(document));

    //     const r = new TaskRenderer();
    //     const task = new TaskBuilder()
    //         //.description('this has [[links]] to a page.')
    //         .dueDate(moment('2022-02-02 14:34:23'))
    //         .build();

    //     expect(await r.toHTMLElement(task)).toBe('2022-02-02 14:34:23');
    // });
});
