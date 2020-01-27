import {CommandExecution, ExecutionStatus} from "../command/command-execution";

/**
 * Base class for command execution related events.
 */
export class CommandExecutionEvent {
    public readonly commandId: string;
    public readonly startTime: number;

    /**
     * Create a matcher, that can be passed to {@link Events}, to listen to all events, related to the specified
     * execution of the command.
     *
     * @param commandId ID of the command
     * @param startTime start time of the execution
     */
    static createMatcher(commandId: string, startTime: number): any {
        return {commandId: commandId, startTime: startTime};
    }

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
    public readonly newStatus: string;

    /**
     * Create a matcher, that can be passed to {@link Events}, to listen to status changed events, related to the
     * specified command execution.
     *
     * @param commandId ID of the command
     * @param startTime start time of the execution
     */
    static createMatcher(commandId: string, startTime: number): any {
        return Object.assign({type: 'status'}, CommandExecutionEvent.createMatcher(commandId, startTime));
    }

    /**
     * Construct an event.
     *
     * @param execution execution about which the event will be constructed
     * @param newStatus new status of the execution
     */
    constructor(execution: CommandExecution, newStatus: ExecutionStatus) {
        super(execution, 'status');
        this.newStatus = newStatus.toString();
    }
}

/**
 * Output (either STDOUT or STDERR) of the command execution has changed.
 */
export class OutputChangedEvent extends CommandExecutionEvent {

    /**
     * Create a matcher, that can be passed to {@link Events}, to listen to output changed events, related to the
     * specified command execution.
     *
     * @param commandId ID of the command
     * @param startTime start time of the execution
     */
    static createMatcher(commandId: string, startTime: number): any {
        return Object.assign({type: 'output'}, CommandExecutionEvent.createMatcher(commandId, startTime));
    }

    /**
     * Construct an event.
     *
     * @param execution execution about which the event will be constructed
     * @param changes lines, that were added to the output of the execution
     */
    constructor(execution: CommandExecution, public readonly changes: Array<string>) {
        super(execution, 'output');
    }
}