import {Command} from "../../../backend/core/command/command";
import {Database} from "sqlite";
import {instance, mock, when} from "ts-mockito";
import {SelectFromDatabase} from "../../../backend/core/database/select-from-database";
import {executeAndReturnOutput} from "../../common";
import { expect } from "chai";

describe('SelectFromDatabase', function () {
    const rows: Array<any> = [{'a': 1}, {'a': 2}];
    const table: string = 'my_table';
    let database: Database;
    let command: Command;
    beforeEach(function () {
        database = mock<Database>();
        command = new SelectFromDatabase(instance(database));
    });
    it('should select all rows from the specified table', async function () {
        // given
        when(database.all(`SELECT * FROM ${table}`)).thenResolve(rows);
        // when
        const actualRows: Array<any> = await executeAndReturnOutput(command, {table: table}).toPromise();
        // then
        expect(actualRows).eql(rows);
    });
    it('should select rows from the specified table, that match the specified query', async function () {
        // given
        const query: any = {'a': 15, 'b': 'c'};
        when(database.all(`SELECT * FROM ${table} WHERE a = ? AND b = ?`, 15, 'c')).thenResolve(rows);
        // when
        const actualRows: Array<any> = await executeAndReturnOutput(command, {table: table, query: query}).toPromise();
        // then
        expect(actualRows).eql(rows);
    });
});
