import {ConfigCommand} from "./base";
import {Observable, Subscriber} from "rxjs";
import {JsonDB} from "node-json-db";
import {CommandExecutor} from "../command/command-executor";
import {READ_CONFIG, ReadConfig} from "./read-config";
import {MODIFY_CONFIG, ModifyConfig} from "./modify-config";

export const NAME = 'initialize config';

/**
 * Initialize the config sub-system.
 */
export class InitializeConfig extends ConfigCommand {
    /**
     * Construct a command.
     *
     * @param commandExecutor command executor to register config-related commands in
     * @param config config to operate on
     */
    constructor(private commandExecutor: CommandExecutor, config: JsonDB) {
        super(config);
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.commandExecutor.register(READ_CONFIG, new ReadConfig(this.config));
        this.commandExecutor.register(MODIFY_CONFIG, new ModifyConfig(this.config));
        output.complete();
    }
}
