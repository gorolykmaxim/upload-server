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
}
