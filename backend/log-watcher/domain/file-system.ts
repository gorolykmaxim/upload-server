import {PathLike, Stats} from "fs";

export interface FileSystem {
    access(path: PathLike, mode?: number): Promise<void>;
    stat(path: PathLike): Promise<Stats>;
    readFile(path: PathLike, options?: any): Promise<Buffer | string>;
}
