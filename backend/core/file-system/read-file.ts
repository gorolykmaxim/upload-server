import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";

export const READ_FILE: string = 'read file';

/**
 * Read contents of the file, located by the specified path.
 */
export class ReadFile extends FileSystemCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const data: string | Buffer = await this.fileSystem.readFile(args.path, args);
        output.next(data.toString());
        output.complete();
    }
}
