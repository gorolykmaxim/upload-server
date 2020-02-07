import {PathLike, Stats, WriteStream} from "fs";

/**
 * Interface for fs.promises node module.
 * All the methods correspond to the actual fs.promises functions.
 */
export interface FileSystem {
    stat(path: PathLike): Promise<Stats>;
    access(path: PathLike, mode?: number): Promise<void>;
    readFile(path: PathLike, options?: any): Promise<string | Buffer>;
    createWriteStream(path: PathLike, options?: any): WriteStream;
    rename(oldPath: PathLike, newPath: PathLike): Promise<void>;
    unlink(path: PathLike): Promise<void>;
    rmdir(path: PathLike, options?: any): Promise<void>;
    mkdir(path: PathLike, options?: any): Promise<void>;
}
