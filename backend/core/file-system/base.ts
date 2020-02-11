import {Command} from "../command/command";
import {FileSystem} from "./file-system";
import {PathLike} from "fs";

/**
 * Base class for all file-system-related commands.
 */
export abstract class FileSystemCommand extends Command {
    /**
     * Construct a command.
     *
     * @param fileSystem file system to interact with
     */
    constructor(protected fileSystem: FileSystem) {
        super();
    }
}

/**
 * Arguments, that can be passed to commands, that only required path to the specified file.
 */
export class PathArgs {
    /**
     * Construct arguments.
     *
     * @param path path to the file or directory to operate on
     */
    constructor(readonly path: PathLike) {
    }
}

/**
 * Arguments, that can be passed to commands, that require path to the specified file but also allow additional
 * options to be passed as well.
 */
export class PathWithOptionsArgs extends PathArgs {
    /**
     * Construct arguments.
     *
     * @param path path to the file or directory to operate on
     * @param options additional optional options, that could be passed to the command
     */
    constructor(path: PathLike, readonly options?: any) {
        super(path);
    }
}
