import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";

/**
 * Read data from the config.
 *
 * Mandatory arguments:
 * - path - JSON path (like XPATH) to the place in the config data structure, where data should be read from
 */
export const READ_CONFIG: string = 'read config';

export class ReadConfig extends ConfigCommand {
    readonly mandatoryArgs: Array<string> = ['path'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        output.next(this.config.getData(args.path));
        output.complete();
    }
}
