import {Process, ProcessCommand, ProcessWithPIDIsNotRunning} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";

export const SEND_SIGNAL_TO_PROCESS: string = 'send signal to process';

/**
 * Send a signal to the process with the specified pid.
 * The command finishes immediately.
 */
export class SendSignalToProcess extends ProcessCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['pid', 'signal'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const pid: number = args.pid;
        const signal: number = args.signal;
        const process: Process = this.pidToProcess.getValue(pid);
        if (!process) {
            throw new Error(`Failed to send signal ${signal}: ${new ProcessWithPIDIsNotRunning(pid).message}`);
        }
        process.childProcess.kill(signal);
        output.complete();
    }
}
