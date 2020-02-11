import {Process, ProcessCommand, ProcessWithPIDIsNotRunning} from "./base";
import {Observable, Subscriber} from "rxjs";
import {Dictionary} from "typescript-collections";

/**
 * Watch output lines (STDOUT and STDERR combined) of the process with the specified pid.
 * The command finishes immediately but it output will complete when the process will end producing the output.
 *
 * Mandatory arguments:
 * - pid - ID of the process to watch
 */
export const WATCH_PROCESS_OUTPUT: string = 'watch process output';

export class WatchProcessOutput extends ProcessCommand {
    readonly mandatoryArgs: Array<string> = ['pid'];

    /**
     * Construct a command.
     *
     * @param pidToProcess a map where each key is a PID and each value is the corresponding process
     * @param eol end-of-line separator of STDOUT and STDERR of processes
     */
    constructor(pidToProcess: Dictionary<number, Process>, private eol: string) {
        super(pidToProcess);
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const pid: number = args.pid;
        const process: Process = this.pidToProcess.getValue(pid);
        if (!process) {
            throw new Error(`Failed to watch output of a process: ${new ProcessWithPIDIsNotRunning(pid)}`);
        }
        const stdoutBuffer: StringBuffer = new StringBuffer(this.eol);
        const stderrBuffer: StringBuffer = new StringBuffer(this.eol);
        output.add(() => {
            stdoutBuffer.clear();
            stderrBuffer.clear();
        });
        output.add(process.error.subscribe(e => output.error(e)));
        output.add(process.close.subscribe(() => output.complete()));
        output.add(process.stdoutData.subscribe(data => stdoutBuffer.readLines(data.toString()).forEach(line => output.next(line))));
        output.add(process.stderrData.subscribe(data => stderrBuffer.readLines(data.toString()).forEach(line => output.next(line))));
    }
}

/**
 * Buffer of string data, being read.
 * The buffer always reads only complete string lines of data, while buffering those lines, that were
 * not completed with an end-of-line separator, for the next read.
 */
export class StringBuffer {
    private data: string = null;

    /**
     * Construct a buffer.
     *
     * @param eol end-of-line separator, that will be used in content, that will be read with this buffer
     */
    constructor(private eol: string) {
    }

    /**
     * Read finished string lines from the specified data. If a line is not finished - it will get buffered until
     * the next data read, where it is most likely to be completed with a missing part.
     *
     * @param data chunk of data to be read in lines
     */
    readLines(data: string): Array<string> {
        if (this.data != null) {
            // Non-empty buffer means, that last chunk of content, had last line
            // interrupted. This means that the first line of current chunk is the continuation of that line.
            data = this.data + data;
        }
        const lines: Array<string> = data.split(this.eol);
        const lastLine: string = lines.pop();
        if (lastLine !== '') {
            // We've just split a string by line-ending delimiter. That string didn't end with a line-ending symbol,
            // it means that line was not complete. We will not emit that line and save it until next time, since next
            // time we will receive the rest of that line.
            this.data = lastLine;
        }
        return lines;
    }

    /**
     * Clear the buffer.
     */
    clear() {
        this.data = null;
    }
}
