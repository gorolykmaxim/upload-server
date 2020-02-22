import {Command, CommandRepository} from "./command";
import {Execution, ExecutionRepository} from "./execution";
import {ProcessFactory} from "./process";
import {Clock} from "clock";
import {constants} from "os";
import {EMPTY, merge, Observable, of, Subject} from "rxjs";
import {ExecutionEvent, OutputChangeEvent, StatusChangeEvent} from "./events";
import {filter, take, takeUntil} from "rxjs/operators";

/**
 * A bounded context of a command-executor, module, that allows executing shell commands, stores and shows their
 * output, keeps history of command executions, notifies about events, happening with command executions in real time.
 */
export class CommandExecutorBoundedContext {
    private outputChanges: Subject<OutputChangeEvent> = new Subject<OutputChangeEvent>();
    private statusChanges: Subject<StatusChangeEvent> = new Subject<StatusChangeEvent>();

    /**
     * Construct a bounded context.
     *
     * @param commandRepository repository of commands, that can be executed
     * @param clock clock that will be used to determine execution start times
     * @param processFactory factory that will be used to create processes, that would carry executions
     * @param activeExecutionsRepository repository that will be used to store executions, that are currently running
     * @param completeExecutionsRepository repository that will be used to store executions, that have already finished
     */
    constructor(private commandRepository: CommandRepository, private clock: Clock,
                private processFactory: ProcessFactory, private activeExecutionsRepository: ExecutionRepository,
                private completeExecutionsRepository: ExecutionRepository) {
        this.statusChanges.subscribe(this.handleExecutionStatusChange.bind(this));
    }

    /**
     * Get all the commands, that can be executed.
     */
    getAllExecutableCommands(): Array<Command> {
        return this.commandRepository.findAll();
    }

    /**
     * Create a command, that can be executed later. Return created command.
     *
     * @param name unique name of the command
     * @param command actual shell command to be executed
     * @throws CommandAlreadyExistsError if command with the specified name already exists
     */
    createCommand(name: string, command: string): Command {
        const executableCommand: Command = new Command(name, command);
        if (this.commandRepository.findById(executableCommand.id)) {
            throw new CommandAlreadyExistsError(name);
        }
        this.commandRepository.add(executableCommand);
        return executableCommand;
    }

    /**
     * Remove command with the specified ID. This will not remove execution history of the specified command, since
     * it might still be of use.
     *
     * @param id ID of the command to remove
     * @throws ExecutionsLookupError in case of a failed attempt to lookup executions in one of the repositories
     * @throws ExecutionOperationError in case of a failed attempt to remove the execution from one of the repositories
     */
    async removeCommand(id: string): Promise<void> {
        const command: Command = this.commandRepository.findById(id);
        if (command) {
            const executions: Array<ExecutionSummary> = await this.getExecutionsOfCommand(id);
            await Promise.all(executions.map(e => this.removeExecution(id, e.startTime)));
            this.commandRepository.remove(command);
        }
    }

    /**
     * Execute the command with the specified ID and return the created execution.
     *
     * @param id ID of the command to execute
     * @throws CommandDoesNotExistError if command with the specified ID does not exist
     */
    async executeCommand(id: string): Promise<StartedExecution> {
        const command: Command = this.getCommandById(id);
        const execution: Execution = command.execute(this.clock, this.processFactory, this.outputChanges, this.statusChanges);
        await this.activeExecutionsRepository.add(execution);
        return {
            startTime: execution.startTime,
            commandId: execution.commandId,
            commandName: execution.commandName,
            commandScript: execution.commandScript
        };
    }

    /**
     * Get all executions of all commands in their chronological descending order, where the most recent executions
     * go first.
     *
     * @throws ExecutionsLookupError in case of a failed attempt to lookup executions in one of the repositories
     */
    async getAllExecutions(): Promise<Array<ExecutionSummary>> {
        const executions: Array<Execution> = [];
        executions.push(...await this.activeExecutionsRepository.findAll());
        executions.push(...await this.completeExecutionsRepository.findAll());
        return this.sortAndSerializeExecutions(executions);
    }

    /**
     * Get all executions of the command with the specified ID in their chronological descending order, where the most
     * recent executions go first.
     *
     * @param id ID of the command
     * @throws CommandDoesNotExistError if command with the specified ID does not exist
     * @throws ExecutionsLookupError in case of a failed attempt to lookup executions in one of the repositories
     */
    async getExecutionsOfCommand(id: string): Promise<Array<ExecutionSummary>> {
        const command: Command = this.getCommandById(id);
        const executions: Array<Execution> = [];
        executions.push(...await this.activeExecutionsRepository.findByCommandName(command.name));
        executions.push(...await this.completeExecutionsRepository.findByCommandName(command.name));
        return this.sortAndSerializeExecutions(executions);
    }

    /**
     * Get detailed information about the execution of the command with the specified ID, that was started at the
     * specified time.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution in milliseconds
     * @param dontSplit if set to true, the output of the execution will be presented as a single string. Otherwise
     * the output will be an array of output lines
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws ExecutionsLookupError in case of a failed attempt to lookup executions in one of the repositories
     * @throws ExecutionDoesNotExistError if there were no executions of the specified command, started at the specified time
     */
    async getExecutionOfCommand(commandId: string, executionStartTime: number, dontSplit: boolean): Promise<ExecutionDetails> {
        const command: Command = this.getCommandById(commandId);
        const execution: Execution = await this.getExecution(command, executionStartTime);
        return {
            startTime: execution.startTime,
            commandId: execution.commandId,
            commandName: execution.commandName,
            commandScript: execution.commandScript,
            exitCode: execution.exitCode,
            exitSignal: execution.exitSignal,
            errorMessage: execution.errorMessage,
            output: dontSplit ? execution.outputAsString : execution.outputLines
        };
    }

    /**
     * Send an OS signal to the execution of the specified command. The execution must be active to receive a signal.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution
     * @param signal signal to send
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws NoActiveExecutionFoundError if there is no execution of the specified command, started at the specified time,
     * that is currently running
     */
    async sendSignalToTheExecution(commandId: string, executionStartTime: number, signal: number): Promise<void> {
        const command: Command = this.getCommandById(commandId);
        const execution: Execution = await this.getActiveExecution(command, executionStartTime);
        execution.sendSignal(signal);
    }

    /**
     * Remove the specified command execution. Both active and complete executions can be removed, though the active
     * ones will be removed with a slight delay.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws ExecutionsLookupError in case of a failed attempt to lookup the execution in one of the repositories
     * @throws ExecutionDoesNotExistError if there were no executions of the specified command, started at the specified time
     * @throws ExecutionOperationError in case of a failed attempt to remove the execution from one of the repositories
     */
    async removeExecution(commandId: string, executionStartTime: number): Promise<void> {
        const command: Command = this.getCommandById(commandId);
        let execution: Execution = await this.activeExecutionsRepository.findByCommandNameAndStartTime(command.name, executionStartTime);
        if (execution) {
            await this.activeExecutionsRepository.remove(execution);
            execution.sendSignal(constants.signals.SIGKILL);
            return;
        }
        execution = await this.completeExecutionsRepository.findByCommandNameAndStartTime(command.name, executionStartTime);
        if (execution) {
            await this.completeExecutionsRepository.remove(execution);
            return;
        }
        throw new ExecutionDoesNotExistError(commandId, executionStartTime);
    }

    /**
     * Remove all executions of all commands (both active and complete).
     *
     * @throws ExecutionsLookupError in case of a failed attempt to lookup the execution in one of the repositories
     * @throws ExecutionOperationError in case of a failed attempt to remove the execution from one of the repositories
     */
    async removeAllExecutions(): Promise<void> {
        const executions: Array<ExecutionSummary> = await this.getAllExecutions();
        await Promise.all(executions.map(e => this.removeExecution(e.commandId, e.startTime)));
    }

    /**
     * Return observable of all events, related to the specified execution. The observable will complete once the
     * watched execution is complete.
     *
     * If the execution is not specified (commandId and executionStartTime not specified) - return observable of
     * all events, happening in command executor. Such observable will not complete.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws NoActiveExecutionFoundError if there is no execution of the specified command, started at the specified time,
     * that is currently running
     */
    async watchAllEvents(commandId?: string, executionStartTime?: number): Promise<Observable<ExecutionEvent>> {
        if (commandId && executionStartTime) {
            return merge(
                await this.watchStatusOfExecution(commandId, executionStartTime),
                await this.watchOutputOfExecution(commandId, executionStartTime, false)
            );
        } else {
            return merge(this.outputChanges, this.statusChanges);
        }
    }

    /**
     * Return observable of all status change events, happening in command executor. The observable will not complete.
     */
    watchStatusesOfAllExecutions(): Observable<StatusChangeEvent> {
        return this.statusChanges;
    }

    /**
     * Return observable of status-related events of the specific execution. The observable will complete once the
     * watched execution is complete.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws NoActiveExecutionFoundError if there is no execution of the specified command, started at the specified time,
     * that is currently running
     */
    async watchStatusOfExecution(commandId: string, executionStartTime: number): Promise<Observable<StatusChangeEvent>> {
        const command: Command = this.getCommandById(commandId);
        const execution: Execution = await this.getActiveExecution(command, executionStartTime);
        return this.statusChanges.pipe(filter(ExecutionEvent.isRelatedTo(execution)), take<StatusChangeEvent>(1));
    }

    /**
     * Return observable of output (both STDOUT and STDERR) change events of the specific execution. The observable will
     * complete once the watched execution is complete.
     *
     * Normally, if the specified execution is not active, the method will throw NoActiveExecutionFoundError.
     * BUT, in case if the fromTheBeginning is set to "true" - it will consider both active and complete executions.
     * In such situation if the found execution is active - the returned observable will complete when the execution
     * will complete. Otherwise, if the found execution is already complete - the returned observable will complete
     * immediately right after emitting all the existing output of the execution.
     *
     * @param commandId ID of the command
     * @param executionStartTime start time of the execution
     * @param fromTheBeginning if set to true - first, the observable will emit all the existing output lines of the
     * specified execution and only after that will start emitting new lines, written to the execution's output.
     * Otherwise will only emit new lines.
     * @throws CommandDoesNotExistError if the command with the specified ID does not exist
     * @throws NoActiveExecutionFoundError if there is no execution of the specified command, started at the specified time,
     * that is currently running
     * @throws ExecutionDoesNotExistError if there were no executions of the specified command, started at the specified time
     */
    async watchOutputOfExecution(commandId: string, executionStartTime: number, fromTheBeginning: boolean): Promise<Observable<OutputChangeEvent>> {
        const command: Command = this.getCommandById(commandId);
        const execution: Execution = fromTheBeginning ? await this.getExecution(command, executionStartTime) : await this.getActiveExecution(command, executionStartTime);
        const existingOutput: Observable<OutputChangeEvent> = fromTheBeginning ? of(new OutputChangeEvent(execution, execution.outputLines)) : EMPTY;
        let futureOutput: Observable<OutputChangeEvent>;
        if (execution.isComplete) {
            futureOutput = EMPTY;
        } else {
            futureOutput = this.outputChanges.pipe(
                filter<OutputChangeEvent>(ExecutionEvent.isRelatedTo(execution)),
                takeUntil(await this.watchStatusOfExecution(commandId, executionStartTime))
            );
        }
        return merge(existingOutput, futureOutput);
    }

    private async handleExecutionStatusChange(event: StatusChangeEvent): Promise<void> {
        const execution: Execution = await this.activeExecutionsRepository.findByCommandNameAndStartTime(event.commandName, event.startTime);
        try {
            // If execution does not exist, than it means that is was deleted during its execution.
            if (execution) {
                if (event.status) {
                    execution.complete(event.status);
                } else {
                    execution.fail(event.error);
                }
                await this.activeExecutionsRepository.remove(execution);
                await this.completeExecutionsRepository.add(execution);
            }
        } catch (e) {
            console.error(`Failed to save execution '${JSON.stringify(execution)}' on it's completion. Reason: ${e.message}`);
        }
    }

    private getCommandById(commandId: string): Command {
        const command: Command = this.commandRepository.findById(commandId);
        if (!command) {
            throw new CommandDoesNotExistError(commandId);
        }
        return command;
    }

    private async getActiveExecution(command: Command, executionStartTime: number): Promise<Execution> {
        const execution: Execution = await this.activeExecutionsRepository.findByCommandNameAndStartTime(command.name, executionStartTime);
        if (!execution) {
            throw new NoActiveExecutionFoundError(command.id, executionStartTime);
        }
        return execution;
    }

    private async getExecution(command: Command, executionStartTime: number): Promise<Execution> {
        let execution: Execution;
        execution = await this.activeExecutionsRepository.findByCommandNameAndStartTime(command.name, executionStartTime);
        if (!execution) {
            execution = await this.completeExecutionsRepository.findByCommandNameAndStartTime(command.name, executionStartTime);
        }
        if (!execution) {
            throw new ExecutionDoesNotExistError(command.id, executionStartTime);
        }
        return execution;
    }

    private sortAndSerializeExecutions(executions: Array<Execution>): Array<ExecutionSummary> {
        return executions
            .sort((a, b) => a.startTime - b.startTime)
            .reverse()
            .map<ExecutionSummary>(e => {
                return {
                    startTime: e.startTime,
                    commandId: e.commandId,
                    commandName: e.commandName,
                    commandScript: e.commandScript,
                    exitCode: e.exitCode,
                    exitSignal: e.exitSignal,
                    errorMessage: e.errorMessage
                }
            });
    }
}

/**
 * Information about a command execution, that has been just started.
 */
export interface StartedExecution {
    /**
     * The time in milliseconds, when the execution has started.
     */
    startTime: number,
    /**
     * ID of the command, to which this execution belongs to.
     */
    commandId: string,
    /**
     * Name of the command, to which this execution belongs to.
     */
    commandName: string,
    /**
     * Actual shell command, that is being executed.
     */
    commandScript: string
}

/**
 * Information about a command execution, that does not contain the output.
 */
export interface ExecutionSummary extends StartedExecution {
    /**
     * Exit code, with which the execution has completed.
     */
    exitCode?: number,
    /**
     * The signal, that has terminated the execution.
     */
    exitSignal?: string,
    /**
     * Message of the error, that has happenned to the execution.
     */
    errorMessage?: string
}

/**
 * Detailed information about the execution.
 */
export interface ExecutionDetails extends ExecutionSummary {
    /**
     * Both STDOUT and STDERR of the execution combined. Can be either a single string or an array of output lines.
     */
    output: Array<string> | string;
}

export class CommandAlreadyExistsError extends Error {
    constructor(commandName: string) {
        super(`Command with name '${commandName}' already exists`);
        Object.setPrototypeOf(this, CommandAlreadyExistsError.prototype);
    }
}

export class CommandDoesNotExistError extends Error {
    constructor(id: string) {
        super(`Command with ID '${id}' does not exist`);
        Object.setPrototypeOf(this, CommandDoesNotExistError.prototype);
    }
}

export class ExecutionDoesNotExistError extends Error {
    constructor(commandId: string, executionStartTime: number) {
        super(`No executions of command with ID ${commandId} were started at ${executionStartTime}`);
        Object.setPrototypeOf(this, ExecutionDoesNotExistError.prototype);
    }
}

export class NoActiveExecutionFoundError extends Error {
    constructor(commandId: string, executionStartTime: number) {
        super(`There is no execution of the command with ID ${commandId}, that was started at ${executionStartTime}, that is currently running`);
        Object.setPrototypeOf(this, NoActiveExecutionFoundError.prototype);
    }
}
