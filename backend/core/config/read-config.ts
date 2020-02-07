import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";

export const READ_CONFIG: string = 'read config';

/**
 * Read data from the config.
 */
export class ReadConfig extends ConfigCommand implements ArgumentsConsumer {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        output.next(this.config.getData(args.path));
        output.complete();
    }
}
