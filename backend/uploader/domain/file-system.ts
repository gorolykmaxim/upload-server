import {Observable} from "rxjs";

export interface FileSystem {
    ensureDirectoryExists(path: string): Promise<void>;
    writeToFile(path: string, data: Observable<string>): Promise<void>;
    move(oldPath: string, newPath: string): Promise<void>;
    removeFileOrDirectory(path: string): Promise<void>;
}
