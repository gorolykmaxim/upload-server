import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";

/**
 * Save specified data structure in the config by the specified path.
 *
 * Mandatory arguments:
 * - path - JSON path (like XPATH) to the place in the config data structure, where specified data should be saved
 * - dataToSave - data that should be save in the specified place in the config
 * Optional arguments:
 * - override - if there is a data already present in the specified path, the command will try to merge the existing
 * data with the specified data by default. Set this argument to "true" if you want command to override the existing
 * data.
 */
export const MODIFY_CONFIG: string = 'modify config';

export class ModifyConfig extends ConfigCommand {
    readonly mandatoryArgs: Array<string> = ['path', 'dataToSave'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.config.push(args.path, args.dataToSave, args.override);
        output.complete();
    }
}
