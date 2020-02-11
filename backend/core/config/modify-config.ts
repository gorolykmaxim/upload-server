import {Observable, Subscriber} from "rxjs";
import {ConfigCommand} from "./base";
import {ReadConfigArgs} from "./read-config";

export const MODIFY_CONFIG: string = 'modify config';

/**
 * Arguments, that could be passed to {@link ModifyConfig}.
 */
export class ModifyConfigArgs extends ReadConfigArgs {
    /**
     * Construct arguments.
     *
     * @param path JSON path (similar to XPATH) where the specified data should be saved.
     * @param dataToSave data to save by the specified path
     */
    constructor(path: string, readonly dataToSave: any) {
        super(path);
    }
}

/**
 * Save specified data structure in the config by the specified path.
 */
export class ModifyConfig extends ConfigCommand {
    readonly argsType = ModifyConfigArgs;
    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: ModifyConfigArgs | any, input?: Observable<any>): Promise<void> {
        this.config.push(args.path, args.dataToSave);
        output.complete();
    }
}
