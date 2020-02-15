import {Command} from "./command";
import {CommandRepository} from "./command-repository";

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
     * Create a command, that can be executed later.
     *
     * @param name unique name of the command
     * @param command actual shell command to be executed
     */
    createCommand(name: string, command: string): Command {
        const executableCommand: Command = new Command(name, command);
        this.commandRepository.add(executableCommand);
        return executableCommand;
    }
}
