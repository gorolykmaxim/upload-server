import {DatabaseCommand, Where} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Select rows from a table in a database.
 *
 * Mandatory arguments:
 * - table - name of the table to select rows from
 * Optional arguments:
 * - query - query that defines what rows should be selected. Just an object where each field is a column name and value
 * is a value to compare to in the query. If omitted - the command will select all rows.
 */
export const SELECT_FROM_DATABASE: string = 'select from database';

export class SelectFromDatabase extends DatabaseCommand {
    readonly mandatoryArgs: Array<string> = ['table'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const table: string = args.table;
        const query: any = args.query;
        let rows: Array<any>;
        if (query) {
            const where: Where = new Where(query);
            rows = await this.database.all(`SELECT * FROM ${table} ${where.statement}`, ...where.values);
        } else {
            rows = await this.database.all(`SELECT * FROM ${table}`);
        }
        output.next(rows);
        output.complete();
    }
}
