import { Status } from '../../Status';
import type { Task } from '../../Task';
import { FilterInstructionsBasedField } from './FilterInstructionsBasedField';

export class StatusField extends FilterInstructionsBasedField {
    constructor() {
        super();

        this._filters.add('done', (task: Task) => task.status.indicator === Status.DONE.indicator);
        this._filters.add('not done', (task: Task) => task.status.indicator !== Status.DONE.indicator);
    }

    protected fieldName(): string {
        return 'status';
    }
}
