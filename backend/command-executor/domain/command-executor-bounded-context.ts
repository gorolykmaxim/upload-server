import {Command, CommandRepository} from "./command";
import {Execution, ExecutionRepository} from "./execution";
import {ProcessFactory, ProcessStatus} from "./process";
import {Clock} from "clock";

/**
 * A bounded context of a command-executor, module, that allows executing shell commands, stores and shows their
 * output, keeps history of command executions, notifies about events, happening with command executions in real time.
 */
export class CommandExecutorBoundedContext {
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
     */
    removeCommand(id: string): void {
        const command: Command = this.commandRepository.findById(id);
        if (command) {
            this.commandRepository.remove(command);
        }
    }

    /**
     * Execute the command with the specified ID and return the created execution.
     *
     * @param id ID of the command to execute
     * @throws CommandDoesNotExist if command with the specified ID does not exist
     */
    async executeCommand(id: string): Promise<StartedExecution> {
        const command: Command = this.commandRepository.findById(id);
        if (!command) {
            throw new CommandDoesNotExist(id);
        }
        const execution: Execution = command.execute(this.clock, this.processFactory);
        await this.activeExecutionsRepository.add(execution);
        execution.statusChanges.subscribe(
            status => this.finalizeExecution(execution, status),
            error => this.finalizeExecution(execution, error)
        );
        return {startTime: execution.startTime, commandName: execution.commandName, commandScript: execution.commandScript};
    }

    private async finalizeExecution(execution: Execution, result: ProcessStatus | Error): Promise<void> {
        try {
            if (result instanceof Error) {
                execution.fail(result);
            } else {
                execution.complete(result);
            }
            await this.activeExecutionsRepository.remove(execution);
            await this.completeExecutionsRepository.add(execution);
        } catch (e) {
            // TODO: maybe raise an event instead of just logging this
            console.error(`Failed to save execution '${JSON.stringify(execution)}' on it's completion. Reason: ${e.message}`);
        }
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
     * Name of the command, to which this execution belongs to.
     */
    commandName: string,
    /**
     * Actual shell command, that is being executed.
     */
    commandScript: string
}

export class CommandAlreadyExistsError extends Error {
    constructor(commandName: string) {
        super(`Command with name '${commandName}' already exists`);
        Object.setPrototypeOf(this, CommandAlreadyExistsError.prototype);
    }
}

export class CommandDoesNotExist extends Error {
    constructor(id: string) {
        super(`Command with ID '${id}' does not exist`);
        Object.setPrototypeOf(this, CommandDoesNotExist.prototype);
    }
}
