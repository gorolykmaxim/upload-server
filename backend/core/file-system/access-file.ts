import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand} from "./base";

/**
 * Check if the file, located by the specified path, can be accessed by the application.
 *
 * Mandatory arguments:
 * - path - path to the file or directory to check
 * Optional arguments:
 * - mode - specific access mode to check
 */
export const ACCESS_FILE: string = 'access file';

export class AccessFile extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.access(args.path, args.mode);
        output.complete();
    }
}
