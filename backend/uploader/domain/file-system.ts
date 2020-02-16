import {Observable} from "rxjs";

export interface FileSystem {
    ensureDirectoryExists(path: string): Promise<void>;
    writeToFile(path: string, data: Observable<string>): Promise<void>;
}
