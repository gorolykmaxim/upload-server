import {DatabaseCommand, Where} from "./base";
import {ArgumentsConsumer} from "../command/command-with-arguments";
import {Observable, Subscriber} from "rxjs";

export const DELETE_FROM_DATABASE: string = 'delete from database';

/**
 * Delete rows from the database "table", that match specified "query". If "query" is not specified - delete all
 * rows from the specified table.
 */
export class DeleteFromDatabase extends DatabaseCommand implements ArgumentsConsumer {
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
