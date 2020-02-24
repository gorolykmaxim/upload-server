import {FileWatcher} from "../domain/file-watcher";
import {fromEvent, Observable, Subject} from "rxjs";
import {ChildProcess, spawn} from "child_process";
import {createInterface} from "readline";
import {constants} from "os";
import {multicast, refCount} from "rxjs/operators";

export class WindowsFileWatcher implements FileWatcher {
    private pathToOutputObservable: any = {};

    constructor(private pathToTailBinary: string) {
    }

    watch(path: string): Observable<string> {
        let output: Observable<string> = this.pathToOutputObservable[path];
        if (!output) {
            output = new Observable<string>(subscriber => {
                const tail: ChildProcess = spawn(this.pathToTailBinary, ['-n', '0', '-f', path]);
                fromEvent(createInterface(tail.stdout), 'line').subscribe(subscriber);
                fromEvent(createInterface(tail.stderr), 'line').subscribe(subscriber);
                subscriber.add(() => tail.kill(constants.signals.SIGINT));
            }).pipe(multicast(new Subject()), refCount());
            this.pathToOutputObservable[path] = output;
        }
        return output;
    }
}
