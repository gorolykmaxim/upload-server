import {Process, ProcessCommand, ProcessWithPIDIsNotRunning} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Send a signal to the process with the specified pid.
 * The command finishes immediately.
 *
 * Mandatory arguments:
 * - pid - ID of the process to kill
 * - signal - actual signal to send to the process
 */
export const SEND_SIGNAL_TO_PROCESS: string = 'send signal to process';

export class SendSignalToProcess extends ProcessCommand {
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
