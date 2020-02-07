import {ReadConfigArgs} from "./read-config";
import {Command} from "../command";
import {Observable, Subscriber} from "rxjs";
import {JsonDB} from "node-json-db";
import {ArgumentError} from "common-errors";

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
export class ModifyConfig extends Command {
    /**
     * Construct a command.
     *
     * @param config config, that houses the data
     */
    constructor(private config: JsonDB) {
        super();
    }

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
