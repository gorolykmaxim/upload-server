import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand, PathArgs} from "./base";

export const GET_FILE_STATS: string = 'get file stats';

/**
 * Get stats information about a file, located by the specified path.
 */
export class GetFileStats extends FileSystemCommand {
    readonly argsType = PathArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: PathArgs | any, input?: Observable<any>): Promise<void> {
        output.next(await this.fileSystem.stat(args.path));
        output.complete();
    }
}
