import {Command} from "./command";
import {CommandRepository} from "./command-repository";
import {CommandAlreadyExistsError} from "./command-already-exists-error";

/**
 * A bounded context of a command-executor, module, that allows executing shell commands, stores and shows their
 * output, keeps history of command executions, notifies about events, happening with command executions in real time.
 */
export class CommandExecutorBoundedContext {
    /**
     * Construct a bounded context.
     *
     * @param commandRepository repository of commands, that can be executed
     */
    constructor(private commandRepository: CommandRepository) {
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
}
