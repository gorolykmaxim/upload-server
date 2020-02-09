import {Process, ProcessCommand} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";
import {ChildProcess} from "child_process";
import {Dictionary} from "typescript-collections";

export const CREATE_PROCESS: string = 'create process';

export type CreateChildProcess = (command: string, args: Array<string>, options?: any) => ChildProcess;

/**
 * Create a process that executes the specified shell command. You can pass an array of arguments to the created
 * process via "args".
 * If the input is specified, the command will pipe it to the process' STDIN and close the STDIN when the input
 * completes or emits an error.
 * The command finishes immediately without waiting for the process to complete or even start.
 */
export class CreateProcess extends ProcessCommand implements ArgumentsConsumer {
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
        const childProcess: ChildProcess = this.createChildProcess(args.command, args.args, args);
        if (input) {
            input.subscribe(line => childProcess.stdin.write(line), e => childProcess.stdin.end(), () => childProcess.stdin.end());
        }
        this.pidToProcess.setValue(childProcess.pid, new Process(childProcess));
        output.next(childProcess.pid);
        output.complete();
    }
}
