import {FileSystemCommand, PathWithOptionsArgs} from "./base";
import {Observable, Subscriber} from "rxjs";
import {Stats} from "fs";

export const DELETE_FILE_OR_DIRECTORY = 'delete file or directory';

/**
 * Delete the file (or directory) located by the specified path.
 * If the target path is a directory which has files in them - specify "recursive":true if you want the command
 * to delete the directory with all the files inside of it.
 */
export class DeleteFileOrDirectory extends FileSystemCommand {
    readonly argsType = PathWithOptionsArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: PathWithOptionsArgs | any, input?: Observable<any>): Promise<void> {
        const stats: Stats = await this.fileSystem.stat(args.path);
        if (stats.isDirectory()) {
            await this.fileSystem.rmdir(args.path, args.options);
        } else {
            await this.fileSystem.unlink(args.path);
        }
        output.complete();
    }
}
