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

describe('editicon block helper', () => {
    it('parses a task and renders editicon', () => {
        const r = new TaskRenderer('{{editicon}}');
        const task = new TaskBuilder().build();

        expect(r.toRenderedString(task)).toBe('<a class="tasks-edit"></a>');
    });
});

describe('backlinks block helper', () => {
    it('parses a task and renders backlink', () => {
        const r = new TaskRenderer('{{backlink}}');
        const task = new TaskBuilder().build();

        expect(r.toRenderedString(task)).toBe(
            '<span class="tasks-backlink"> (<a href="" data-href="" rel="noopener" target="_blank" class="internal-link">/</a>)</span>',
        );
    });

    it('parses a task and renders short backlink', () => {
        const r = new TaskRenderer('{{backlink short="true"}}');
        const task = new TaskBuilder().build();

        expect(r.toRenderedString(task)).toBe(
            '<span class="tasks-backlink"><a href="" data-href="" rel="noopener" target="_blank" class="internal-link internal-link-short-mode"> 🔗</a></span>',
        );
    });
});

describe('Html Element', () => {
    it('handles default template', () => {
        const r = new TaskRenderer();
        const task = new TaskBuilder().dueDate(moment('2022-02-02 14:34:23')).build();
        expect(r.toRenderedString(task)).toBe(
            '<li data-line="1" data-task="" class="task-list-item plugin-tasks-list-item"><input data-line="1" type="checkbox" class="task-list-item-checkbox"><span class="tasks-list-text">my description  📅 2022-02-02 </span><span class="tasks-backlink"> (<a href="" data-href="" rel="noopener" target="_blank" class="internal-link">/</a>)</span><a class="tasks-edit"></a></li>',
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
