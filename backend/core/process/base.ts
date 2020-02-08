import {Command} from "../command/command";
import {Dictionary} from "typescript-collections";
import {ChildProcess} from "child_process";
import {Observable} from "rxjs";

/**
 * Base class for all processing-related commands.
 */
export abstract class ProcessCommand extends Command {
    /**
     * Construct a command.
     *
     * @param pidToProcess a map where each key is a PID and each value is the corresponding process
     */
    constructor(protected pidToProcess: Dictionary<number, Process>) {
        super();
    }
}

/**
 * Processing sub-system can't find a process with the specified PID.
 */
export class ProcessWithPIDIsNotRunning extends Error {
    /**
     * Construct an error.
     *
     * @param pid PID of the process
     */
    constructor(pid: number) {
        super(`There is no process with PID ${pid} running`);
        Object.setPrototypeOf(this, ProcessWithPIDIsNotRunning.prototype);
    }
}

/**
 * Data structure, that represents a running process and an observable of it's output (both STDOUT and STDERR combined).
 * The output observable emits output lines.
 */
export interface Process {
    childProcess: ChildProcess;
    output?: Observable<string>;
}
