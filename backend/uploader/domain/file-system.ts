import {MakeDirectoryOptions, PathLike} from "fs";

export interface FileSystem {
    mkdir(path: PathLike, options?: MakeDirectoryOptions): Promise<void>;
}
