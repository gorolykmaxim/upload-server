import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";
import {FileSystemCommand} from "./base";

export const ACCESS_FILE: string = 'access file';

/**
 * Check if the file, located by the specified path, can be accessed by the application.
 */
export class AccessFile extends FileSystemCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.access(args.path, args.mode);
        output.complete();
    }
}
