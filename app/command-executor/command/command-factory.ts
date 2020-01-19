import {Command} from "./command";
import {CreateChildProcess} from "../../common/child-process";
import {CreateUUID} from "../../common/uuid";
import {Clock} from "clock";

/**
 * Factory of commands.
 */
export class CommandFactory {
    /**
     * Construct a factory.
     *
     * @param createChildProcess factory-method, that will be used by commands to create processes, that will run
     * them
     * @param createUUID factory-method, that will be used to create unique command IDs
     * @param eol end-of-line separator, used in the output of created commands
     * @param clock application's clock, used to determine current time
     */
    constructor(private createChildProcess: CreateChildProcess, private createUUID: CreateUUID, private eol: string,
                private clock: Clock) {
    }

    /**
     * Create a new command.
     *
     * @param name name of the command
     * @param script actual body of the command, that will be executed in a shell
     */
    create(name: string, script: string): Command {
        return new Command(this.createUUID(), name, script, this.createChildProcess, this.eol, this.clock);
    }
}