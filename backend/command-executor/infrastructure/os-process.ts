import {Process, ProcessFactory, ProcessStatus} from "../domain/process";
import {fromEvent, merge, Observable} from "rxjs";
import {ChildProcess, spawn} from "child_process";
import {createInterface} from "readline";
import {take, takeUntil} from "rxjs/operators";

class OsProcess implements Process {
    constructor(private childProcess: ChildProcess) {
    }

    get outputs(): Observable<string> {
        const stdout: Observable<string> = fromEvent(createInterface(this.childProcess.stdout), 'line');
        const stderr: Observable<string> = fromEvent(createInterface(this.childProcess.stderr), 'line');
        return merge(stdout, stderr).pipe(takeUntil<string>(this.status));
    }

    get status(): Observable<ProcessStatus> {
        const close: Observable<ProcessStatus> = fromEvent(this.childProcess, 'close');
        const error: Observable<Error> = fromEvent(this.childProcess, 'error');
        return new Observable<ProcessStatus>(subscriber => {
            close.subscribe(subscriber);
            subscriber.add(error.subscribe(e => subscriber.error(e)));
        }).pipe(take(1));
    }
}

export class OsProcessFactory implements ProcessFactory {
    create(command: string, args: Array<string>): Process {
        return new OsProcess(spawn(command, args));
    }
}
