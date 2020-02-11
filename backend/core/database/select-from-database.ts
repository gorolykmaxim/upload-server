import {DatabaseCommand, Where} from "./base";
import {Observable, Subscriber} from "rxjs";

export const SELECT_FROM_DATABASE: string = 'select from database';

/**
 * Select rows from the database "table", that match specified "query". If "query" is not specified - select all
 * rows from the specified table.
 */
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
