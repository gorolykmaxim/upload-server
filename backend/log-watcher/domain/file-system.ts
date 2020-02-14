import {PathLike} from "fs";

export interface FileSystem {
    access(path: PathLike, mode?: number): Promise<void>;
}
