import {Command} from "../command/command";
import {Database} from "sqlite";

/**
 * The base class of all database-related commands.
 */
export abstract class DatabaseCommand extends Command {
    /**
     * Construct a command.
     *
     * @param database the database to operate on
     */
    constructor(protected database: Database) {
        super();
    }
}

/**
 * Representation of a "WHERE" sql clause.
 */
export class Where {
    /**
     * Actual SQL statement of this "WHERE".
     */
    readonly statement: string;
    /**
     * Values to be placed in place of "?" signs.
     */
    readonly values: Array<any> = [];

    /**
     * Construct a "WHERE".
     *
     * @param query key-value pairs to construct a simple "WHERE" from
     */
    constructor(query: any) {
        const fields: Array<string> = [];
        for (let key in query) {
            if (query.hasOwnProperty(key)) {
                fields.push(`${key} = ?`);
                this.values.push(query[key]);
            }
        }
        this.statement = `WHERE ${fields.join(' AND ')}`;
    }
}
