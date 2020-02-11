import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";

export const READ_CONFIG: string = 'read config';

/**
 * Arguments, that could be passed to {@link ReadConfig}.
 */
export class ReadConfigArgs {
    /**
     * Construct arguments.
     *
     * @param path JSON path (similar to XPATH) to the data in the config, that should be read
     */
    constructor(readonly path: string) {
    }
}

/**
 * Read data from the config.
 */
export class ReadConfig extends ConfigCommand {
    readonly argsType = ReadConfigArgs;
    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: ReadConfigArgs | any, input?: Observable<any>): Promise<void> {
        output.next(this.config.getData(args.path));
        output.complete();
    }
}
