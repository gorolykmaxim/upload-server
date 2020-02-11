import {FileSystemCommand, PathWithOptionsArgs} from "./base";
import {Observable, Subscriber} from "rxjs";

export const READ_FILE: string = 'read file';

/**
 * Read contents of the file, located by the specified path.
 */
export class ReadFile extends FileSystemCommand {
    readonly argsType = PathWithOptionsArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: PathWithOptionsArgs | any, input?: Observable<any>): Promise<void> {
        const data: string | Buffer = await this.fileSystem.readFile(args.path, args.options);
        output.next(data.toString());
        output.complete();
    }
}
