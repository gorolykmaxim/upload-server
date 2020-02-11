import {DatabaseCommand, QueryArgs, Where} from "./base";
import {Observable, Subscriber} from "rxjs";

export const DELETE_FROM_DATABASE: string = 'delete from database';

/**
 * Delete rows from the database "table", that match specified "query". If "query" is not specified - delete all
 * rows from the specified table.
 */
export class DeleteFromDatabase extends DatabaseCommand {
    readonly argsType = QueryArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: QueryArgs | any, input?: Observable<any>): Promise<void> {
        if (args.query) {
            const where: Where = new Where(args.query);
            await this.database.run(`DELETE FROM ${args.table} ${where.statement}`, ...where.values);
        } else {
            await this.database.run(`DELETE FROM ${args.table}`);
        }
        output.complete();
    }
}
