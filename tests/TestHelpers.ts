import { Task } from '../src/Task';

export function fromLine({
    line,
    path = '',
    precedingHeader = '',
}: {
    line: string;
    path?: string;
    precedingHeader?: string | null;
}) {
    return Task.fromLine({
        line,
        path,
        file: null,
        precedingHeader,
        sectionIndex: 0,
        sectionStart: 0,
    })!;
}

export function createTasksFromMarkdown(tasksAsMarkdown: string, path: string, precedingHeader: string): Task[] {
    const taskLines = tasksAsMarkdown.split('\n');
    const tasks: Task[] = [];
    for (const line of taskLines) {
        const task = Task.fromLine({
            line: line,
            path: path,
            file: null,
            precedingHeader: precedingHeader,
            sectionIndex: 0,
            sectionStart: 0,
        });
        if (task) {
            tasks.push(task);
        }
    }
    return tasks;
}
