import {FileWatcher} from "../domain/file-watcher";
import {Observable} from "rxjs";
const Tail = require('nodejs-tail');

export class UnixFileWatcher implements FileWatcher {
    watch(path: string): Observable<string> {
        return new Observable<string>(subscriber => {
            const tail: any = new Tail(path, {usePolling: true});
            tail.watch();
            tail.on('line', (line: string) => subscriber.next(line));
            subscriber.add(() => {
                tail.removeAllListeners();
                tail.close();
            });
        });
    }
}
