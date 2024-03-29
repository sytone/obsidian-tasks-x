<script lang="ts">
    import * as chrono from 'chrono-node';
    import { onMount } from 'svelte';
    import { Recurrence } from '../Recurrence';
    import { getSettings } from '../Config/Settings';
    import { Priority, Task } from '../Task';
    import { Status } from '../Status';
    import { StatusRegistry } from '../StatusRegistry';
    import { doAutocomplete } from '../DateAbbreviations';
    import { CreatedDateProperty } from 'TaskProperties';

    export let task: Task;
    export let onSubmit: (updatedTasks: Task[]) => void | Promise<void>;

    let descriptionInput: HTMLInputElement;
    let editableTask: {
        description: string;
        status: Status;
        priority: 'none' | 'low' | 'medium' | 'high';
        recurrenceRule: string;
        startDate: string;
        scheduledDate: string;
        dueDate: string;
        doneDate: string;
        createdDate: string;
    } = {
        description: '',
        status: Status.TODO,
        priority: 'none',
        recurrenceRule: '',
        startDate: '',
        scheduledDate: '',
        dueDate: '',
        doneDate: '',
        createdDate: '',
    };

    let parsedStartDate: string = '';
    let parsedScheduledDate: string = '';
    let parsedDueDate: string = '';
    let parsedRecurrence: string = '';
    let parsedDone: string = '';
    let parsedCreatedDate: string = '';
    let statusOptions = StatusRegistry.getInstance().registeredStatuses;

    // 'weekend' abbreviation ommitted due to lack of space.
    let datePlaceholder = "Try 'Monday' or 'tomorrow', or [td|tm|yd|tw|nw|we] then space.";

    function parseDate(
        type: 'start' | 'scheduled' | 'due' | 'done' | 'created',
        date: string,
        forwardDate: Date | undefined = undefined,
    ): string {
        if (!date) {
            return `<i>no ${type} date</i>`;
        }
        const parsed = chrono.parseDate(date, forwardDate, {
            forwardDate: forwardDate != undefined,
        });
        if (parsed !== null) {
            return window.moment(parsed).format('YYYY-MM-DD');
        }
        return `<i>invalid ${type} date</i>`;
    }

    $: {
        editableTask.startDate = doAutocomplete(editableTask.startDate);
        parsedStartDate = parseDate('start', editableTask.startDate, new Date());
    }

    $: {
        editableTask.scheduledDate = doAutocomplete(editableTask.scheduledDate);
        parsedScheduledDate = parseDate('scheduled', editableTask.scheduledDate, new Date());
    }

    $: {
        editableTask.dueDate = doAutocomplete(editableTask.dueDate);
        parsedDueDate = parseDate('due', editableTask.dueDate, new Date());
    }

    $: {
        editableTask.createdDate = doAutocomplete(editableTask.createdDate);
        parsedCreatedDate = parseDate('created', editableTask.createdDate, new Date());
    }

    $: {
        if (!editableTask.recurrenceRule) {
            parsedRecurrence = '<i>not recurring</>';
        } else {
            parsedRecurrence =
                Recurrence.fromText({
                    recurrenceRuleText: editableTask.recurrenceRule,
                    // Only for representation in the modal, no dates required.
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                })?.toText() ?? '<i>invalid recurrence rule</i>';
        }
    }

    $: {
        parsedDone = parseDate('done', editableTask.doneDate);
    }

    onMount(() => {
        const { globalFilter } = getSettings();
        const description = task.description.replace(globalFilter, '').replace('  ', ' ').trim();

        let priority: 'none' | 'low' | 'medium' | 'high' = 'none';
        if (task.priority === Priority.Low) {
            priority = 'low';
        } else if (task.priority === Priority.Medium) {
            priority = 'medium';
        } else if (task.priority === Priority.High) {
            priority = 'high';
        }

        editableTask = {
            description,
            status: task.status,
            priority,
            recurrenceRule: task.recurrence ? task.recurrence.toText() : '',
            startDate: task.startDate ? task.startDate.format('YYYY-MM-DD') : '',
            scheduledDate: task.scheduledDate ? task.scheduledDate.format('YYYY-MM-DD') : '',
            dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : '',
            doneDate: task.doneDate ? task.doneDate.format('YYYY-MM-DD') : '',
            createdDate: task.created ? task.created.format('YYYY-MM-DD') : '',
        };
        setTimeout(() => {
            descriptionInput.focus();
        }, 10);
    });

    const _onSubmit = () => {
        let description = editableTask.description.trim();

        let startDate: moment.Moment | null = null;
        const parsedStartDate = chrono.parseDate(editableTask.startDate, new Date(), { forwardDate: true });
        if (parsedStartDate !== null) {
            startDate = window.moment(parsedStartDate);
        }

        let scheduledDate: moment.Moment | null = null;
        const parsedScheduledDate = chrono.parseDate(editableTask.scheduledDate, new Date(), { forwardDate: true });
        if (parsedScheduledDate !== null) {
            scheduledDate = window.moment(parsedScheduledDate);
        }

        let dueDate: moment.Moment | null = null;
        const parsedDueDate = chrono.parseDate(editableTask.dueDate, new Date(), { forwardDate: true });
        if (parsedDueDate !== null) {
            dueDate = window.moment(parsedDueDate);
        }

        let createdDate: moment.Moment | null = null;
        const parsedCreatedDate = chrono.parseDate(editableTask.createdDate, new Date(), { forwardDate: true });
        if (parsedCreatedDate !== null) {
            createdDate = window.moment(parsedCreatedDate);
        }

        let recurrence: Recurrence | null = null;
        if (editableTask.recurrenceRule) {
            recurrence = Recurrence.fromText({
                recurrenceRuleText: editableTask.recurrenceRule,
                startDate,
                scheduledDate,
                dueDate,
            });
        }

        let parsedPriority: Priority;
        switch (editableTask.priority) {
            case 'low':
                parsedPriority = Priority.Low;
                break;
            case 'medium':
                parsedPriority = Priority.Medium;
                break;
            case 'high':
                parsedPriority = Priority.High;
                break;
            default:
                parsedPriority = Priority.None;
        }

        const updatedTask = new Task({
            ...task,
            description,
            status: editableTask.status,
            priority: parsedPriority,
            recurrence,
            startDate,
            scheduledDate,
            dueDate,
            doneDate: window.moment(editableTask.doneDate, 'YYYY-MM-DD').isValid()
                ? window.moment(editableTask.doneDate, 'YYYY-MM-DD')
                : null,
            createdDate: new CreatedDateProperty(createdDate),
        });

        onSubmit([updatedTask]);
    };
</script>

<div class="tasks-modal">
    <form on:submit|preventDefault={_onSubmit}>
        <div class="tasks-modal-section">
            <label for="description">Description</label>
            <input
                bind:value={editableTask.description}
                bind:this={descriptionInput}
                id="description"
                type="text"
                class="tasks-modal-description"
                placeholder="Take out the trash"
            />
        </div>
        <hr />
        <div class="tasks-modal-section">
            <label for="priority">Priority</label>
            <select bind:value={editableTask.priority} id="priority" class="dropdown">
                <option value="none">None</option>
                <option value="high">⏫ High</option>
                <option value="medium">🔼 Medium</option>
                <option value="low">🔽 Low</option>
            </select>
        </div>
        <hr />
        <div class="tasks-modal-section">
            <label for="recurrence">Recurrence</label>
            <input
                bind:value={editableTask.recurrenceRule}
                id="description"
                type="text"
                placeholder="Try 'every 2 weeks on Thursday'."
            />
            <code>🔁 {@html parsedRecurrence}</code>
        </div>
        <hr />
        <div class="tasks-modal-section">
            <div class="tasks-modal-date">
                <label for="due">Due</label>
                <input bind:value={editableTask.dueDate} id="due" type="text" placeholder={datePlaceholder} />
                <code>📅 {@html parsedDueDate}</code>
            </div>
            <div class="tasks-modal-date">
                <label for="scheduled">Scheduled</label>
                <input
                    bind:value={editableTask.scheduledDate}
                    id="scheduled"
                    type="text"
                    placeholder={datePlaceholder}
                />
                <code>⏳ {@html parsedScheduledDate}</code>
            </div>
            <div class="tasks-modal-date">
                <label for="start">Start</label>
                <input bind:value={editableTask.startDate} id="start" type="text" placeholder={datePlaceholder} />
                <code>🛫 {@html parsedStartDate}</code>
            </div>
            <div class="tasks-modal-date">
                <label for="created">Created</label>
                <input bind:value={editableTask.createdDate} id="created" type="text" placeholder={datePlaceholder} />
                <code>➕ {@html parsedCreatedDate}</code>
            </div>
        </div>
        <hr />
        <div class="tasks-modal-section">
            <label for="status">Status </label>
            <select bind:value={editableTask.status} id="status" class="dropdown">
                {#each statusOptions as status}
                    <option value={status}>{status.name}</option>
                {/each}
            </select>
        </div>
        <div class="tasks-modal-section">
            <div>
                Completed:
                <input
                    type="checkbox"
                    class="task-list-item-checkbox tasks-modal-checkbox"
                    checked={editableTask.status === Status.DONE}
                    disabled
                />
            </div>
            <div>
                Done on:
                <code>{@html parsedDone}</code>
            </div>
        </div>
        <hr />
        <div class="tasks-modal-section" />
        <div class="tasks-modal-section">
            <button type="submit" class="mod-cta">Apply</button>
        </div>
    </form>
</div>
