import {FileSystemCommand} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";
import {WriteStream} from "fs";

export const WRITE_TO_FILE: string = 'write to file';

/**
 * Write the input of this command to the file, located by the specified path.
 * The command finishes immediately but the output of it will get complete only when the input either completes
 * or emits an error.
 */
export class WriteToFile extends FileSystemCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const writable: WriteStream = this.fileSystem.createWriteStream(args.path, args);
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
