import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand} from "./base";

/**
 * Write "true" to the output if the file, located by the specified path, can be accessed by the application. Otherwise,
 * write "false".
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
        try {
            await this.fileSystem.access(args.path, args.mode);
            output.next(true);
        } catch (e) {
            output.next(false);
        }
        output.complete();
    }
}
