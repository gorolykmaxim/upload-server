import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";
import {Stats} from "fs";

/**
 * Delete the file (or directory) located by the specified path.
 *
 * Mandatory arguments:
 * - path - path to the file/directory to delete
 * Optional arguments:
 * - options - additional options
 * If the target path is a directory which has files in them - specify "recursive":true in the "options" if you want
 * the command to delete the directory with all the files inside of it.
 */
export const DELETE_FILE_OR_DIRECTORY = 'delete file or directory';

export class DeleteFileOrDirectory extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const path: string = args.path;
        const stats: Stats = await this.fileSystem.stat(path);
        if (stats.isDirectory()) {
            await this.fileSystem.rmdir(path, args.options);
        } else {
            await this.fileSystem.unlink(path);
        }
        output.complete();
    }
}
