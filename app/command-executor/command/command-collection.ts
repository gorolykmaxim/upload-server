import {DatabaseCollection, EntityMapping} from "../../common/collection/database-collection";
import {Command} from "./command";
import {CommandFactory} from "./command-factory";
import { Database } from "sqlite";

/**
 * Mapping of a command.
 */
export class CommandMapping implements EntityMapping<Command> {
    /**
     * Create command mapping.
     *
     * @param factory factory to domain model representations of commands
     */
    constructor(private factory: CommandFactory) {
    }

    /**
     * {@inheritDoc}
     */
    deserialize(entity: any): Command {
        return this.factory.create(entity['NAME'], entity['SCRIPT'], entity['ID']);
    }

    /**
     * {@inheritDoc}
     */
    serialize(entity: Command): any {
        return {
            'ID': entity.id,
            'NAME': entity.name,
            'SCRIPT': entity.script
        };
    }
}

/**
 * Collection of commands.
 */
export class CommandCollection extends DatabaseCollection<Command> {
    /**
     * Construct a collection.
     *
     * @param factory factory that will be used to reconstruct commands, stored in the database
     * @param database database, where the collection will store commands
     */
    constructor(factory: CommandFactory, database: Database) {
        super(new CommandMapping(factory), 'COMMAND', database, 'ID');
    }
}