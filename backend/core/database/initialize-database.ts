import {Command} from "../command/command";
import {Observable, Subscriber} from "rxjs";
import {CommandExecutor} from "../command/command-executor";
import {Database} from "sqlite";
import {SELECT_FROM_DATABASE, SelectFromDatabase} from "./select-from-database";
import {INSERT_INTO_DATABASE, InsertIntoDatabase} from "./insert-into-database";
import {DELETE_FROM_DATABASE, DeleteFromDatabase} from "./delete-from-database";

export const INITIALIZE_DATABASE: string = 'initialize database';

/**
 * Initialize database sub-system.
 */
export class InitializeDatabase extends Command {
    /**
     * Construct a command.
     *
     * @param commandExecutor command executor to register database-related commands in
     * @param database the database to operate on
     */
    constructor(private commandExecutor: CommandExecutor, private database: Database) {
        super();
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.commandExecutor.register(SELECT_FROM_DATABASE, new SelectFromDatabase(this.database));
        this.commandExecutor.register(INSERT_INTO_DATABASE, new InsertIntoDatabase(this.database));
        this.commandExecutor.register(DELETE_FROM_DATABASE, new DeleteFromDatabase(this.database));
        output.complete();
    }
}
