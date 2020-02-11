import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Rename the file (or possible move it to another directory).
 *
 * Mandatory arguments:
 * - oldPath - current path to the file
 * - newPath - new path to the file
 */
export const RENAME_FILE: string = 'rename file';

export class RenameFile extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['oldPath', 'newPath'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.rename(args.oldPath, args.newPath);
        output.complete();
    }
}
