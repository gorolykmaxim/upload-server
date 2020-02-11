import {DatabaseCommand, QueryArgs, Where} from "./base";
import {Observable, Subscriber} from "rxjs";

export const SELECT_FROM_DATABASE: string = 'select from database';

/**
 * Select rows from the database "table", that match specified "query". If "query" is not specified - select all
 * rows from the specified table.
 */
export class SelectFromDatabase extends DatabaseCommand {
    readonly argsType = QueryArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: QueryArgs | any, input?: Observable<any>): Promise<void> {
        let rows: Array<any>;
        if (args.query) {
            const where: Where = new Where(args.query);
            rows = await this.database.all(`SELECT * FROM ${args.table} ${where.statement}`, ...where.values);
        } else {
            rows = await this.database.all(`SELECT * FROM ${args.table}`);
        }
        output.next(rows);
        output.complete();
    }
}
