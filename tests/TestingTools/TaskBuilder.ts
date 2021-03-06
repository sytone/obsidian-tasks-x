// Builder
import type { Moment } from 'moment';
import type { TFile } from 'obsidian';
import moment from 'moment';
import { StatusRegistry } from '../../src/StatusRegistry';
import { Priority, Task } from '../../src/Task';
import type { Recurrence } from '../../src/Recurrence';
import { DateParser } from '../../src/Query/DateParser';
import { Status } from '../../src/Status';
import type { CreatedDateProperty } from '../../src/TaskProperties';

/**
 * A fluent class for creating tasks for tests.
 *
 * This uses the Builder Pattern.
 *
 * See TaskBuilder.build() for an example of use.
 *
 * IMPORTANT: Changed values are retained after calls to .build()
 *            There is no way to reset a TaskBuilder to its default
 *            start currently.
 *            Create a new TaskBuilder object to start from a clean state,
 */
export class TaskBuilder {
    private _status: Status = Status.TODO;
    private _description: string = 'my description';
    private _path: string = '';
    private _file: TFile | null = null;
    private _indentation: string = '';

    private _sectionStart: number = 0;
    private _sectionIndex: number = 0;

    private _precedingHeader: string | null = null;
    private _tags: string[] = [];
    private _priority: Priority = Priority.None;

    private _startDate: Moment | null = null;
    private _scheduledDate: Moment | null = null;
    private _dueDate: Moment | null = null;
    private _doneDate: Moment | null = null;
    private _createdDate: CreatedDateProperty | null = null;

    private _recurrence: Recurrence | null = null;
    private _blockLink: string = '';

    private static parseDate(date: string | null): Moment | null {
        if (date) {
            return DateParser.parseDate(date);
        } else {
            return null;
        }
    }

    /**
     * Build a Task
     *
     * Example of use:
     *
     *  const builder = new TaskBuilder();
     *  const task = builder
     *      .description('hello world')
     *      .priority(Priority.High)
     *      .path('root/dir 1/dir 2/file name')
     *      .build();
     */
    public build(): Task {
        return new Task({
            status: this._status,
            description: this._description,
            path: this._path,
            file: this._file,
            indentation: this._indentation,
            sectionStart: this._sectionStart,
            sectionIndex: this._sectionIndex,
            precedingHeader: this._precedingHeader,
            priority: this._priority,
            startDate: this._startDate,
            scheduledDate: this._scheduledDate,
            dueDate: this._dueDate,
            createdDate: this._createdDate,
            doneDate: this._doneDate,
            recurrence: this._recurrence,
            blockLink: this._blockLink,
            tags: this._tags,
            originalMarkdown: '',
        });
    }

    public status(status: Status): TaskBuilder {
        this._status = status;
        return this;
    }

    public description(description: string): TaskBuilder {
        this._description = description;
        return this;
    }

    /** Set the task's path on disc, including file name extension
     *
     * @param path Path to file, including file name extension. Use empty string to indicate 'unknown
     */
    public path(path: string): TaskBuilder {
        this._path = path;
        return this;
    }

    public file(file: TFile | null): TaskBuilder {
        this._file = file;
        return this;
    }

    public indentation(indentation: string): TaskBuilder {
        this._indentation = indentation;
        return this;
    }

    public sectionStart(sectionStart: number): TaskBuilder {
        this._sectionStart = sectionStart;
        return this;
    }

    public sectionIndex(sectionIndex: number): TaskBuilder {
        this._sectionIndex = sectionIndex;
        return this;
    }

    public originalStatusCharacter(originalStatusCharacter: string): TaskBuilder {
        this._status = StatusRegistry.getInstance().byIndicator(originalStatusCharacter);
        return this;
    }

    public precedingHeader(precedingHeader: string | null): TaskBuilder {
        this._precedingHeader = precedingHeader;
        return this;
    }

    public tags(tags: string[]): TaskBuilder {
        this._tags = tags;
        return this;
    }

    public priority(priority: Priority): TaskBuilder {
        this._priority = priority;
        return this;
    }

    public startDate(startDate: string | Moment | null): TaskBuilder {
        if (moment.isMoment(startDate)) {
            this._startDate = startDate;
        } else {
            this._startDate = TaskBuilder.parseDate(startDate);
        }
        return this;
    }

    public scheduledDate(scheduledDate: string | Moment | null): TaskBuilder {
        if (moment.isMoment(scheduledDate)) {
            this._scheduledDate = scheduledDate;
        } else {
            this._scheduledDate = TaskBuilder.parseDate(scheduledDate);
        }
        return this;
    }

    public dueDate(dueDate: string | Moment | null): TaskBuilder {
        if (moment.isMoment(dueDate)) {
            this._dueDate = dueDate;
        } else {
            this._dueDate = TaskBuilder.parseDate(dueDate);
        }
        return this;
    }

    public doneDate(doneDate: string | Moment | null): TaskBuilder {
        if (moment.isMoment(doneDate)) {
            this._doneDate = doneDate;
        } else {
            this._doneDate = TaskBuilder.parseDate(doneDate);
        }
        return this;
    }

    public recurrence(recurrence: Recurrence | null): TaskBuilder {
        this._recurrence = recurrence;
        return this;
    }

    public blockLink(blockLink: string): TaskBuilder {
        this._blockLink = blockLink;
        return this;
    }
}
