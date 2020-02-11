import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";

export const MODIFY_CONFIG: string = 'modify config';

/**
 * Save specified data structure in the config by the specified path.
 */
export class ModifyConfig extends ConfigCommand {
    readonly mandatoryArgs: Array<string> = ['path', 'dataToSave'];
    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.config.push(args.path, args.dataToSave);
        output.complete();
    }
}
