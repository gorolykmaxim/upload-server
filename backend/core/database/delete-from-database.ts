import {DatabaseCommand, Where} from "./base";
import {Observable, Subscriber} from "rxjs";

/**
 * Delete rows from a table in a database.
 *
 * Mandatory arguments:
 * - table - name of the table to delete rows from
 * Optional arguments:
 * - query - query that defines what rows should be removed. Just an object where each field is a column name and value
 * is a value to compare to in the query. If omitted - the command will remove all rows.
 */
export const DELETE_FROM_DATABASE: string = 'delete from database';

export class DeleteFromDatabase extends DatabaseCommand {
    readonly mandatoryArgs: Array<string> = ['table'];

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const table: string = args.table;
        const query: any = args.query;
        if (query) {
            const where: Where = new Where(query);
            await this.database.run(`DELETE FROM ${table} ${where.statement}`, ...where.values);
        } else {
            await this.database.run(`DELETE FROM ${table}`);
        }
        output.complete();
    }
}
