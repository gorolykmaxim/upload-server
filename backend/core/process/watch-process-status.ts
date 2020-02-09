import {Process, ProcessCommand, ProcessWithPIDIsNotRunning} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";

export const WATCH_PROCESS_STATUS: string = 'watch process status';

/**
 * Watch changes in the status of the specified process. The output may emit either a {@link CloseEvent} on
 * process termination or an {@link Error} (notice: the error emitted by the process will be emitted as a normal event).
 * The command finishes immediately but its output will complete when the process will get terminated (or when
 * the process will emit an error).
 */
export class WatchProcessStatus extends ProcessCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['pid'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const pid: number = args.pid;
        const process: Process = this.pidToProcess.getValue(pid);
        if (!process) {
            output.error(new Error(`Failed to watch status of a process: ${new ProcessWithPIDIsNotRunning(pid)}`));
        } else {
            output.add(process.closeOrError.subscribe(output));
        }
    }
}
