import { Editor, MarkdownView, View } from 'obsidian';
import type { StatusConfiguration } from '../Status';
import { StatusRegistry } from '../StatusRegistry';

import { Task, TaskRegularExpressions } from '../Task';

export const toggleStatus = (status: StatusConfiguration, checking: boolean, editor: Editor, view: View) => {
    if (checking) {
        if (!(view instanceof MarkdownView)) {
            // If we are not in a markdown view, the command shouldn't be shown.
            return false;
        }

        // The command should always trigger in a markdown view:
        // - Convert lines to list items.
        // - Convert list items to tasks.
        // - Toggle tasks' status to match indicator.
        return true;
    }

    // Should never happen due to check above.
    if (!(view instanceof MarkdownView)) {
        return;
    }

    // We are certain we are in the editor due to the check above.
    const path = view.file?.path;
    if (path === undefined) {
        return;
    }

    const cursorPosition = editor.getCursor();
    const lineNumber = cursorPosition.line;
    const line = editor.getLine(lineNumber);

    const toggledLine = toggleLine({ line, path, indicator: status.indicator });
    editor.setLine(lineNumber, toggledLine);

    // The cursor is moved to the end of the line by default.
    // If there is text on the line, put the cursor back where it was on the line.
    if (/[^ [\]*-]/.test(toggledLine)) {
        editor.setCursor({
            line: cursorPosition.line,
            // Need to move the cursor by the distance we added to the beginning.
            ch: cursorPosition.ch + toggledLine.length - line.length,
        });
    }
};

const toggleLine = ({ line, path, indicator }: { line: string; path: string; indicator: string }): string => {
    let toggledLine: string = line;

    const task = Task.fromLine({
        line,
        path,
        file: null,
        sectionStart: 0, // We don't need this to toggle it here in the editor.
        sectionIndex: 0, // We don't need this to toggle it here in the editor.
        precedingHeader: null, // We don't need this to toggle it here in the editor.
    });
    if (task !== null) {
        toggledLine = toggleTask({ task, indicator });
    } else {
        // If the task is null this means that we have one of:
        // 1. a regular checklist item
        // 2. a list item
        // 3. a simple text line

        // The task regex will match checklist items.
        const regexMatch = line.match(TaskRegularExpressions.taskRegex);
        if (regexMatch !== null) {
            toggledLine = toggleChecklistItem({ regexMatch, indicator });
        } else {
            // This is not a checklist item. It is one of:
            // 1. a list item
            // 2. a simple text line

            const listItemRegex = /^([\s\t]*)([-*])/;
            if (listItemRegex.test(line)) {
                // Let's convert the list item to a checklist item.
                toggledLine = line.replace(listItemRegex, `$1$2 [${indicator}]`);
            } else {
                // Let's convert the line to a list item.
                toggledLine = line.replace(/^([\s\t]*)/, '$1- ');
            }
        }
    }

    return toggledLine;
};

const toggleTask = ({ task, indicator }: { task: Task; indicator: string }): string => {
    // Toggle a regular task.
    const toggledTasks = task.toggle(StatusRegistry.getInstance().byIndicator(indicator));
    const serialized = toggledTasks.map((task: Task) => task.toFileLineString()).join('\n');
    return serialized;
};

const toggleChecklistItem = ({
    regexMatch,
    indicator,
}: {
    regexMatch: RegExpMatchArray;
    indicator: string;
}): string => {
    // It's a checklist item, let's toggle it.
    const indentation = regexMatch[1];
    const body = regexMatch[3];
    const toggledLine = `${indentation}- [${indicator}] ${body}`;
    return toggledLine;
};
