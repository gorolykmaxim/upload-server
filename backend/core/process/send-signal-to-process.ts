import {PidArgs, Process, ProcessCommand, ProcessWithPIDIsNotRunning} from "./base";
import {Observable, Subscriber} from "rxjs";

export const SEND_SIGNAL_TO_PROCESS: string = 'send signal to process';

/**
 * Arguments, that can be passed to {@link SendSignalToProcess}.
 */
export class SendSignalToProcessArgs extends PidArgs {
    /**
     * Construct a command.
     *
     * @param pid ID of the process
     * @param signal signal to send to the process
     */
    constructor(pid: number, readonly signal: number) {
        super(pid);
    }
}

/**
 * Send a signal to the process with the specified pid.
 * The command finishes immediately.
 */
export class SendSignalToProcess extends ProcessCommand {
    readonly argsType = SendSignalToProcessArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: SendSignalToProcessArgs | any, input?: Observable<any>): Promise<void> {
        const process: Process = this.pidToProcess.getValue(args.pid);
        if (!process) {
            throw new Error(`Failed to send signal ${args.signal}: ${new ProcessWithPIDIsNotRunning(args.pid).message}`);
        }
        process.childProcess.kill(args.signal);
        output.complete();
    }
}
