import {ProcessStatus} from "./process";
import {Execution} from "./execution";

/**
 * A generic type of an event, that is related to some specific execution.
 */
export class ExecutionEvent {
    readonly commandName: string;
    readonly startTime: number;

    /**
     * Return a function, that will accept an execution event as an argument and will return true if the specified event
     * is related to the specified execution.
     *
     * @param execution execution to compare events against
     */
    static isRelatedTo(execution: Execution): (e: ExecutionEvent) => boolean {
        return e => e.commandName === execution.commandName && e.startTime === execution.startTime;
    }

    /**
     * Construct an event.
     *
     * @param execution execution, to which this event is related to
     */
    constructor(execution: Execution) {
        this.commandName = execution.commandName;
        this.startTime = execution.startTime;
    }
}

/**
 * Output of an execution has changed.
 */
export class OutputChangeEvent extends ExecutionEvent {
    /**
     * Construct an event.
     *
     * @param execution the execution, output of which has changed
     * @param changes new lines, that were appended to the output
     */
    constructor(execution: Execution, readonly changes: Array<string>) {
        super(execution);
    }
}

/**
 * Status of an execution has changed. This also means that the execution has become complete.
 */
export class StatusChangeEvent extends ExecutionEvent {
    /**
     * Construct an event.
     *
     * @param execution the execution, status of which has changed
     * @param status new status of the execution. If the execution has failed with an error - the status will be null
     * @param error the error, which which the execution has failed. If the execution has completed normally -
     * the error will be null
     */
    constructor(execution: Execution, readonly status: ProcessStatus = null, readonly error: Error = null) {
        super(execution);
    }
}
