import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Read contents of the file, located by the specified path.
 *
 * Mandatory arguments:
 * - path - path to the file
 * Optional arguments:
 * - options - additional options
 */
export const READ_FILE: string = 'read file';

export class ReadFile extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const data: string | Buffer = await this.fileSystem.readFile(args.path, args.options);
        output.next(data.toString());
        output.complete();
    }
}
