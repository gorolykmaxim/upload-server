import {Observable} from "rxjs";

export interface FileWatcher {
    watch(path: string): Observable<string>;
}
