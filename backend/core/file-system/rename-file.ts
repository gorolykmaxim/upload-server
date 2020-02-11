import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

export const RENAME_FILE: string = 'rename file';

/**
 * Arguments, that can be passed to {@link RenameFile}.
 */
export class RenameFileArgs {
    /**
     * Construct arguments.
     *
     * @param oldPath path to the existing file
     * @param newPath new path to the specified file
     */
    constructor(readonly oldPath: string, readonly newPath: string) {
    }
}

/**
 * Rename the file, located by the specified oldPath, to the newPath.
 */
export class RenameFile extends FileSystemCommand {
    readonly argsType = RenameFileArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: RenameFileArgs | any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.rename(args.oldPath, args.newPath);
        output.complete();
    }
}
