import {ChildProcess} from "child_process";
import {EventEmitter} from "events";
import {StringBuffer} from "../../common/string-buffer";
import {constants} from "os";

/**
 * Callback, called each time there is a new line the command execution's output (either STDOUT or STDERR).
 */
export type OnOutputLine = (line: string) => void;
/**
 * Callback, called when status of command execution changes.
 */
export type OnStatusChange = (newStatus: ExecutionStatus) => void;

/**
 * Status of a command execution.
 */
export enum ExecutionStatus {
    executing = 'executing', finished = 'finished', failed = 'failed'
}

/**
 * All possible statuses of a command execution, that is finished.
 */
export const FINISHED_STATUSES: Set<ExecutionStatus> = new Set([ExecutionStatus.failed, ExecutionStatus.finished]);

/**
 * Execution of a command.
 */
export class CommandExecution {
    private static readonly OUTPUT_LINE = 'output line';
    private static readonly STATUS_CHANGE = 'status change';
    private readonly stdoutBuffer: StringBuffer;
    private readonly stderrBuffer: StringBuffer;
    private readonly outputChanges: EventEmitter = new EventEmitter();
    private readonly statusChanges: EventEmitter = new EventEmitter();

    /**
     * Compare two executions and return:
     * -1 if a is newer than b
     * 0 if a is as old as b
     * 1 if a is older than b
     *
     * @param a one execution
     * @param b another execution
     */
    static compare(a: CommandExecution, b: CommandExecution): number {
        if (a.startTime > b.startTime) {
            return -1;
        } else if (b.startTime > a.startTime) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Start new command execution. Use this factory-method, when you actually want to run a physical command
     * as a process.
     *
     * @param commandId ID of the command
     * @param startTime current time in milliseconds
     * @param process physical OS process, that executes the command
     * @param eol end-of-line separator, used in the output of this command
     */
    static new(commandId: string, startTime: number, process: ChildProcess, eol: string): CommandExecution {
        const execution: CommandExecution = new CommandExecution(commandId, startTime, eol, process);
        process.stdout.on('data', data => execution.writeOutput(data.toString(), execution.stdoutBuffer));
        process.stderr.on('data', data => execution.writeOutput(data.toString(), execution.stderrBuffer));
        process.on('error', execution.failCommand.bind(execution));
        process.on('close', execution.finishCommand.bind(execution));
        return execution;
    }

    /**
     * Re-create an execution, that was finished somewhere in the past. Use this factory-method, when you need
     * to reconstruct an execution, that has been finished in the past.
     *
     * @param commandId ID of the command
     * @param startTime execution's start time in milliseconds
     * @param outputLines array of lines, outputted during this execution
     * @param status status of this execution
     * @param eol end-of-line separator, used in the output of this command
     */
    static finished(commandId: string, startTime: number, outputLines: Array<string>, status: ExecutionStatus, eol: string): CommandExecution {
        return new CommandExecution(commandId, startTime, eol, null, outputLines, status);
    }

    private constructor(public readonly commandId: string, public readonly startTime: number,
                        public readonly eol: string, private readonly process?: ChildProcess,
                        private readonly outputLines?: Array<string>, private status?: ExecutionStatus) {
        this.stdoutBuffer = new StringBuffer(eol);
        this.stderrBuffer = new StringBuffer(eol);
        this.outputLines = this.outputLines ?? [];
        this.status = this.status ?? ExecutionStatus.executing;
    }

    /**
     * Add a listener, that will be called each time a new line is being written to this command execution's STDOUT or
     * STDERR.
     *
     * @param listener listener to be called
     */
    addOutputListener(listener: OnOutputLine): void {
        this.outputChanges.on(CommandExecution.OUTPUT_LINE, listener);
    }

    /**
     * Remove a listener of command execution's STDOUT and STDERR.
     *
     * @param listener listener to remove
     */
    removeOutputListener(listener: OnOutputLine): void {
        this.outputChanges.removeListener(CommandExecution.OUTPUT_LINE, listener);
    }

    /**
     * Add a listener, that will be called each time the execution changes it's status.
     *
     * @param listener listener to be called
     */
    addStatusListener(listener: OnStatusChange): void {
        this.statusChanges.on(CommandExecution.STATUS_CHANGE, listener);
    }

    /**
     * Remove a listener of command execution's status changes.
     *
     * @param listener listener to remove
     */
    removeStatusListener(listener: OnStatusChange): void {
        this.statusChanges.removeListener(CommandExecution.STATUS_CHANGE, listener);
    }

    /**
     * Return current output (combination of STDOUT and STDERR) of the execution as a single string.
     */
    getOutputAsString(): string {
        return this.outputLines.join(this.eol);
    }

    /**
     * Return current output (combination of STDOUT and STDERR) of the execution as an array of output lines.
     */
    getOutputLines(): Array<string> {
        return this.outputLines;
    }

    /**
     * Get current status of the command execution.
     */
    getStatus(): ExecutionStatus {
        return this.status;
    }

    /**
     * Attempt to gracefully terminate this command execution.
     * Execution, that is already finished, can't be terminated.
     */
    terminate(): void {
        if (FINISHED_STATUSES.has(this.status)) {
            throw new TerminationInWrongStateError(this.commandId, this.startTime, this.status);
        }
        this.process.kill(constants.signals.SIGINT);
    }

    /**
     * Forcefully end this command execution.
     * Execution, that is already finished, can't be halted.
     */
    halt(): void {
        if (FINISHED_STATUSES.has(this.status)) {
            throw new TerminationInWrongStateError(this.commandId, this.startTime, this.status);
        }
        this.process.kill(constants.signals.SIGKILL);
    }

    /**
     * Forcefully ends the execution and finalizes it without waiting for the actual process to receive the signal.
     */
    haltAbruptly(): void {
        this.halt();
        this.forcefullyFinalize();
    }

    /**
     * Detach this execution from it's underlying process and make it a plain data representation of an execution, which
     * was active once upon a time. Clean-up all the resources, that were associated with this execution.
     * Only a finished command execution can be finalized.
     */
    finalize(): void {
        if (!FINISHED_STATUSES.has(this.status)) {
            throw new FinalizationInWrongStateError(this.commandId, this.startTime, this.status);
        }
        this.forcefullyFinalize();
    }

    private forcefullyFinalize(): void {
        this.stdoutBuffer.clear();
        this.stderrBuffer.clear();
        this.outputChanges.removeAllListeners();
        this.statusChanges.removeAllListeners();
    }

    private writeOutput(data: string, buffer: StringBuffer): void {
        const lines: Array<string> = buffer.readLines(data);
        this.appendOutputLines(lines);
    }

    private finishCommand(code?: number, signal?: string): void {
        const lastOutputLines: Array<string> = [];
        let newStatus: ExecutionStatus = ExecutionStatus.failed;
        if (code !== null) {
            if (code === 0) {
                newStatus = ExecutionStatus.finished;
            }
            lastOutputLines.push(`Process exited with code ${code}`);
        }
        if (signal !== null) {
            lastOutputLines.push(`The process was terminated with a signal '${signal}'`);
        }
        this.appendOutputLines(lastOutputLines);
        this.changeStatus(newStatus);
    }

    private failCommand(error: Error): void {
        this.appendOutputLine(error.message);
        this.changeStatus(ExecutionStatus.failed);
    }

    private appendOutputLine(line: string): void {
        this.outputLines.push(line);
        this.outputChanges.emit(CommandExecution.OUTPUT_LINE, line);
    }

    private appendOutputLines(lines: Array<string>): void {
        this.outputLines.push(...lines);
        lines.forEach(line => this.outputChanges.emit(CommandExecution.OUTPUT_LINE, line));
    }

    private changeStatus(newStatus: ExecutionStatus): void {
        this.status = newStatus;
        this.statusChanges.emit(CommandExecution.STATUS_CHANGE, this.status);
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `CommandExecution{commandId=${this.commandId}, startTime=${this.startTime}, eol=${this.eol}, stdoutBuffer=${this.stdoutBuffer}, stderrBuffer=${this.stderrBuffer}, status=${this.status}, lines=${this.outputLines.length}}`;
    }
}

/**
 * An attempt was made to terminate a command execution, that is already finished.
 */
export class TerminationInWrongStateError extends Error {
    /**
     * Construct an error.
     *
     * @param id ID of the command
     * @param startTime start time of the execution in milliseconds
     * @param status current status of the execution
     */
    constructor(id: string, startTime: number, status: ExecutionStatus) {
        super(`Execution of command with ID ${id}, started at ${startTime}, can't be terminated: execution is already over: current state is - ${status}`);
        Object.setPrototypeOf(this, TerminationInWrongStateError.prototype);
    }
}

/**
 * An attempt was made to finalize a command execution, that has not finished yet.
 */
export class FinalizationInWrongStateError extends Error {
    /**
     * Construct an error.
     *
     * @param id ID of the command
     * @param startTime start time of the execution in milliseconds
     * @param status current status of the execution
     */
    constructor(id: string, startTime: number, status: ExecutionStatus) {
        super(`Execution of command with ID ${id}, started at ${startTime}, can't be finalized: execution is not over yet: current state is - ${status}`);
        Object.setPrototypeOf(this, FinalizationInWrongStateError.prototype);
    }
}