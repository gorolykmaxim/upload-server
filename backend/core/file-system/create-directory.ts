import {FileSystemCommand, PathWithOptionsArgs} from "./base";
import {Observable, Subscriber} from "rxjs";

export const CREATE_DIRECTORY: string = 'create directory';

/**
 * Create the directory by the specified path.
 * If you have current directory structure /a/b and you want to create a directory 'd' in /a/b/c/d - specify
 * "recursive":true, so the 'c' directory will get created automatically.
 */
export class CreateDirectory extends FileSystemCommand {
    readonly argsType = PathWithOptionsArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: PathWithOptionsArgs | any, input?: Observable<any>): Promise<void> {
        await this.fileSystem.mkdir(args.path, args.options);
        output.complete();
    }
}
