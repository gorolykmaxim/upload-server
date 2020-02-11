import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

export const RENAME_FILE: string = 'rename file';

/**
 * Rename the file, located by the specified oldPath, to the newPath.
 */
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
