import {FileSystemCommand} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";
import {Stats} from "fs";

export const DELETE_FILE_OR_DIRECTORY = 'delete file or directory';

/**
 * Delete the file (or directory) located by the specified path.
 * If the target path is a directory which has files in them - specify "recursive":true if you want the command
 * to delete the directory with all the files inside of it.
 */
export class DeleteFileOrDirectory extends FileSystemCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const path: string = args.path;
        const stats: Stats = await this.fileSystem.stat(path);
        if (stats.isDirectory()) {
            await this.fileSystem.rmdir(path, args);
        } else {
            await this.fileSystem.unlink(path);
        }
        output.complete();
    }
}
