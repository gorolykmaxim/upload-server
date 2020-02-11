import {FileSystemCommand, PathWithOptionsArgs} from "./base";
import {Observable, Subscriber} from "rxjs";
import {WriteStream} from "fs";

export const WRITE_TO_FILE: string = 'write to file';

/**
 * Write the input of this command to the file, located by the specified path.
 * The command finishes immediately but the output of it will get complete only when the input either completes
 * or emits an error.
 */
export class WriteToFile extends FileSystemCommand {
    readonly argsType = PathWithOptionsArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: PathWithOptionsArgs | any, input?: Observable<any>): Promise<void> {
        const writable: WriteStream = this.fileSystem.createWriteStream(args.path, args.options);
        input.subscribe(data => writable.write(data), e => this.handleFinish(output, writable, e), () => this.handleFinish(output, writable));
    }

    private handleFinish(output: Subscriber<any>, writable: WriteStream, error?: Error): void {
        writable.end();
        if (error) {
            output.error(error);
        } else {
            output.complete();
        }
    }
}
