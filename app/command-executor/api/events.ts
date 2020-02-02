import {CommandExecution, ExecutionStatus} from "../command/command-execution";

/**
 * Base class for command execution related events.
 */
export class CommandExecutionEvent {
    public readonly commandId: string;
    public readonly startTime: number;

    /**
     * Construct an event.
     *
     * @param execution execution about which the event will be constructed
     * @param type type of the event
     */
    constructor(execution: CommandExecution, public readonly type: string) {
        this.commandId = execution.commandId;
        this.startTime = execution.startTime;
    }
}

/**
 * Status of the command execution has changed.
 */
export class StatusChangedEvent extends CommandExecutionEvent {
    public static readonly TYPE = 'status';
    public readonly newStatus: string;

    /**
     * Construct an event.
     *
     * @param execution execution about which the event will be constructed
     * @param newStatus new status of the execution
     */
    constructor(execution: CommandExecution, newStatus: ExecutionStatus) {
        super(execution, StatusChangedEvent.TYPE);
        this.newStatus = newStatus.toString();
    }
}

/**
 * Output (either STDOUT or STDERR) of the command execution has changed.
 */
export class OutputChangedEvent extends CommandExecutionEvent {
    public static readonly TYPE = 'output';
    /**
     * Construct an event.
     *
     * @param execution execution about which the event will be constructed
     * @param changes lines, that were added to the output of the execution
     */
    constructor(execution: CommandExecution, public readonly changes: Array<string>) {
        super(execution, OutputChangedEvent.TYPE);
    }
}