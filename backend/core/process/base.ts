import {Command} from "../command/command";
import {Dictionary} from "typescript-collections";
import {ChildProcess} from "child_process";
import {fromEvent, merge, Observable} from "rxjs";
import {dematerialize, map, materialize, take, takeUntil, takeWhile} from "rxjs/operators";

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
 * Process representation in the processing sub-system.
 */
export class Process {
    /**
     * Construct a process.
     *
     * @param childProcess actual OS process
     */
    constructor(public readonly childProcess: ChildProcess) {
    }

    /**
     * Convenience getter that returns observable of 'close' events, emitted by the child process.
     */
    get close(): Observable<CloseEvent> {
        return fromEvent(this.childProcess, 'close')
            .pipe(
                map<any, CloseEvent>((value, index) => {return {code: value[0], signal: value[1]}}),
                take<CloseEvent>(1)
            );
    }

    /**
     * Convenience getter that returns observable of 'errors', emitted by the child process.
     */
    get error(): Observable<Error> {
        return fromEvent(this.childProcess, 'error').pipe(take<Error>(1));
    }

    /**
     * Convenience getter that returns observable of stdout 'data' events, emitted by the child process.
     */
    get stdoutData(): Observable<Buffer | string> {
        return fromEvent(this.childProcess.stdout, 'data').pipe(takeUntil<Buffer | string>(this.closeOrError));
    }

    /**
     * Convenience getter that returns observable of stderr 'data' events, emitted by the child process.
     */
    get stderrData(): Observable<Buffer | string> {
        return fromEvent(this.childProcess.stderr, 'data').pipe(takeUntil<Buffer | string>(this.closeOrError));
    }

    /**
     * Convenience getter that returns observable of 'close' and 'error' events, emitted by the child process.
     */
    get closeOrError(): Observable<CloseEvent | Error> {
        return merge(this.close.pipe(materialize()), this.error.pipe(materialize()))
            .pipe(
                takeWhile(n => n.hasValue),
                dematerialize()
            );
    }
}

/**
 * An event emitter by the process on the latter ones closure.
 * Consists of the process' exist code and a signal name, that was sent to the process. At all times at least
 * one of the two attributes will have non-null value.
 */
export interface CloseEvent {
    code?: number;
    signal?: string;
}
