import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand, PathArgs} from "./base";
import {PathLike} from "fs";

export const ACCESS_FILE: string = 'access file';

/**
 * Arguments, that can be passed to {@link AccessFile}.
 */
export class AccessFileArgs extends PathArgs {
    /**
     * Construct arguments.
     *
     * @param path path to the file or directory to operate on
     * @param mode optional mode with the file is expected to be accessible
     */
    constructor(path: PathLike, readonly mode?: number) {
        super(path);
    }
}

/**
 * Check if the file, located by the specified path, can be accessed by the application.
 */
export class AccessFile extends FileSystemCommand {
    readonly argsType = AccessFileArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: AccessFileArgs | any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.access(args.path, args.mode);
        output.complete();
    }
}
