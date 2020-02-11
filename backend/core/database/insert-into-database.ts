import {DatabaseCommand, TableArgs} from "./base";
import {Observable, Subscriber} from "rxjs";
import {toArray} from "rxjs/operators";

export const INSERT_INTO_DATABASE: string = 'insert into database';

/**
 * Inserts each element from the input to the specified "table" in the database.
 */
export class InsertIntoDatabase extends DatabaseCommand {
    readonly argsType = TableArgs;

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: TableArgs | any, input?: Observable<any>): Promise<void> {
        const rows: Array<any> = await input.pipe(toArray()).toPromise();
        for (let row of rows) {
            const columns: Array<string> = [];
            const placeholders: Array<string> = [];
            const values: Array<any> = [];
            for (let key in row) {
                if (row.hasOwnProperty(key)) {
                    columns.push(key);
                    placeholders.push('?');
                    values.push(row[key]);
                }
            }
            await this.database.run(`INSERT INTO ${args.table}(${columns.join(', ')}) VALUES(${placeholders.join(', ')})`, ...values);
        }
        output.complete();
    }
}
