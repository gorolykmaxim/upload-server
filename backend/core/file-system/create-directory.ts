import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Create the directory by the specified path.
 *
 * Mandatory arguments:
 * - path - path to the directory, that should be created
 * Optional arguments:
 * - options - additional options to supply
 * If you have current directory structure /a/b and you want to create a directory 'd' in /a/b/c/d - specify
 * "recursive":true in the "options", so the 'c' directory will get created automatically.
 */
export const CREATE_DIRECTORY: string = 'create directory';

export class CreateDirectory extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.mkdir(args.path, args.options);
        output.complete();
    }
}
