import {ReadConfigArgs} from "./read-config";
import {Observable, Subscriber} from "rxjs";
import {ArgumentError} from "common-errors";
import {ConfigCommand} from "./base";

/**
 * Name, to which {@link ModifyConfig} command is assigned to.
 */
export const MODIFY_CONFIG = 'modify config';

/**
 * Arguments, that can be passed to {@link ModifyConfig}.
 */
export interface ModifyConfigArgs extends ReadConfigArgs {
    /**
     * Data structure, that should be saved by the specified path to
     * the config.
     */
    dataToSave: any;
}

/**
 * Save specified data structure in the config by the specified path.
 */
export class ModifyConfig extends ConfigCommand {
    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const a: ModifyConfigArgs = args;
        if (!a || !a.path || !a.dataToSave) {
            throw new ArgumentError('path and dataToSave');
        }
        this.config.push(a.path, a.dataToSave);
    }
}
