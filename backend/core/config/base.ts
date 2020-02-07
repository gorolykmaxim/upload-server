import {JsonDB} from "node-json-db";
import {Command} from "../command/command";

/**
 * Base class for all the commands, that work with the config.
 */
export abstract class ConfigCommand extends Command {
    /**
     * Construct a command.
     *
     * @param config config, that houses the data
     */
    constructor(protected config: JsonDB) {
        super();
    }
}
