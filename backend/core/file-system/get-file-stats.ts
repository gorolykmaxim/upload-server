import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand} from "./base";

export const GET_FILE_STATS: string = 'get file stats';

/**
 * Get stats information about a file, located by the specified path.
 */
export class GetFileStats extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        output.next(await this.fileSystem.stat(args.path));
        output.complete();
    }
}
