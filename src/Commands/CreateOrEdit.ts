import { App, Editor, MarkdownView, View } from 'obsidian';
import { CreatedDateProperty } from 'TaskProperties';
import moment from 'moment';
import { StatusRegistry } from '../StatusRegistry';
import { TaskModal } from '../TaskModal';
import { Status } from '../Status';
import { Priority, Task, TaskRegularExpressions } from '../Task';

export const createOrEdit = (checking: boolean, editor: Editor, view: View, app: App) => {
    if (checking) {
        return view instanceof MarkdownView;
    }

    if (!(view instanceof MarkdownView)) {
        // Should never happen due to check above.
        return;
    }

    const path = view.file?.path;
    if (path === undefined) {
        return;
    }

    const cursorPosition = editor.getCursor();
    const lineNumber = cursorPosition.line;
    const line = editor.getLine(lineNumber);
    const task = taskFromLine({ line, path });

    const onSubmit = (updatedTasks: Task[]): void => {
        const serialized = updatedTasks.map((task: Task) => task.toFileLineString()).join('\n');
        editor.setLine(lineNumber, serialized);
    };

    // Need to create a new instance every time, as cursor/task can change.
    const taskModal = new TaskModal({
        app,
        task,
        onSubmit,
    });
    taskModal.open();
};

const taskFromLine = ({ line, path }: { line: string; path: string }): Task => {
    const task = Task.fromLine({
        line,
        path,
        file: null,
        sectionStart: 0, // We don't need this to toggle it here in the editor.
        sectionIndex: 0, // We don't need this to toggle it here in the editor.
        precedingHeader: null, // We don't need this to toggle it here in the editor.
    });

    if (task !== null) {
        return task;
    }

    // If we are not on a line of a task, we take what we have.
    // The non-task line can still be a checklist, for example if it is lacking the global filter.
    const nonTaskRegex: RegExp = /^([\s\t]*)[-*]? *(\[(.)\])? *(.*)/u;
    const nonTaskMatch = line.match(nonTaskRegex);
    if (nonTaskMatch === null) {
        // Should never happen; everything in the regex is optional.
        console.error('Tasks: Cannot create task on line:', line);
        return new Task({
            status: Status.TODO,
            description: '',
            path,
            file: null,
            indentation: '',
            priority: Priority.None,
            startDate: null,
            scheduledDate: null,
            dueDate: null,
            doneDate: null,
            createdDate: new CreatedDateProperty(moment()),
            recurrence: null,
            // We don't need the following fields to edit here in the editor.
            sectionStart: 0,
            sectionIndex: 0,
            precedingHeader: null,
            blockLink: '',
            tags: [],
            originalMarkdown: '',
        });
    }

    const indentation: string = nonTaskMatch[1];
    const statusString: string = nonTaskMatch[3] ?? ' ';
    const status = StatusRegistry.getInstance().byIndicator(statusString);
    let description: string = nonTaskMatch[4];

    const blockLinkMatch = line.match(TaskRegularExpressions.blockLinkRegex);
    const blockLink = blockLinkMatch !== null ? blockLinkMatch[0] : '';

    if (blockLink !== '') {
        description = description.replace(TaskRegularExpressions.blockLinkRegex, '');
    }

    return new Task({
        status,
        description,
        path,
        file: null,
        indentation,
        blockLink,
        priority: Priority.None,
        startDate: null,
        scheduledDate: null,
        dueDate: null,
        doneDate: null,
        createdDate: new CreatedDateProperty(moment()),
        recurrence: null,
        // We don't need the following fields to edit here in the editor.
        sectionStart: 0,
        sectionIndex: 0,
        precedingHeader: null,
        tags: [],
        originalMarkdown: '',
    });
};
