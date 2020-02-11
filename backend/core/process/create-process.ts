import {Process, ProcessCommand} from "./base";
import {Observable, Subscriber} from "rxjs";
import {ChildProcess} from "child_process";
import {Dictionary} from "typescript-collections";

export const CREATE_PROCESS: string = 'create process';

/**
 * Create a process that executes the specified shell command.
 * If the input is specified, the command will pipe it to the process' STDIN and close the STDIN when the input
 * completes or emits an error.
 * The command finishes immediately without waiting for the process to complete or even start.
 *
 * Mandatory arguments:
 * - command - actual shell command to execute inside the new process
 * Optional arguments:
 * - args - command line arguments to pass to the executed command
 * - options - additional options
 */
export type CreateChildProcess = (command: string, args: Array<string>, options?: any) => ChildProcess;

export class CreateProcess extends ProcessCommand {
    readonly mandatoryArgs: Array<string> = ['command'];

    /**
     * Construct a command.
     *
     * @param createChildProcess factory method to create the actual process
     * @param pidToProcess a map where each key is a PID and each value is the corresponding process
     */
    constructor(private createChildProcess: CreateChildProcess, pidToProcess: Dictionary<number, Process>) {
        super(pidToProcess);
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const childProcess: ChildProcess = this.createChildProcess(args.command, args.args, args.options);
        if (input) {
            input.subscribe(line => childProcess.stdin.write(line), e => childProcess.stdin.end(), () => childProcess.stdin.end());
        }
        const pid: number = childProcess.pid;
        const process: Process = new Process(childProcess);
        this.pidToProcess.setValue(pid, process);
        // The command should make sure the process will get removed from the map on the completion.
        process.closeOrError.subscribe(() => this.pidToProcess.remove(pid));
        output.next(childProcess.pid);
        output.complete();
    }
}
