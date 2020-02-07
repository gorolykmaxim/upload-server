import {Command} from "../command";
import {JsonDB} from "node-json-db";

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
