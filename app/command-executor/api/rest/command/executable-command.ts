import {Command} from "../../../command/command";

/**
 * A command, that can be executed by the clients of the Command Executor API.
 */
export class ExecutableCommand {
    public readonly id: string;
    public readonly name: string;
    public readonly script: string;

    /**
     * Construct a command.
     *
     * @param command an actual command, to construct from
     */
    constructor(command: Command) {
        this.id = command.id;
        this.name = command.name;
        this.script = command.script;
    }
}