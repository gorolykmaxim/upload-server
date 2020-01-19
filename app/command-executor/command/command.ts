import {CommandExecution} from "./command-execution";
import {CreateChildProcess} from "../../common/child-process";
import {ChildProcess} from "child_process";
import {Clock} from "clock";

/**
 * A terminal command, that can be executed.
 */
export class Command {
    /**
     * Construct a command.
     *
     * @param id unique ID of the command
     * @param name human-readable name of the command
     * @param script body of the command, that must be a script, that can be ran in a shell, which hosts this process
     * @param createChildProcess factory-method, that will be used to create a new process, that will be executing
     * this command
     * @param eol end-of-line separator, used in the output of this command
     * @param clock application's clock, used to determine current time
     */
    constructor(public readonly id: string, public readonly name: string, public readonly script: string,
                private createChildProcess: CreateChildProcess, private eol: string, private clock: Clock) {
    }

    /**
     * Create and return a new execution of this command.
     */
    execute(): CommandExecution {
        const process: ChildProcess = this.createChildProcess(this.script, []);
        return CommandExecution.new(this.id, this.clock.now(), process, this.eol);
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `Command{id=${this.id}, name=${this.name}, script=${this.script}, eol=${this.eol}}`;
    }
}
