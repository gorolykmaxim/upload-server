import {Command} from "../../../backend/core/command/command";
import {Database} from "sqlite";
import {instance, mock, verify} from "ts-mockito";
import {DeleteFromDatabase} from "../../../backend/core/database/delete-from-database";
import {executeAndReturnOutput} from "../../common";

describe('DeleteFromDatabase', function () {
    const table: string = 'my_table';
    let database: Database;
    let command: Command;
    beforeEach(function () {
        database = mock<Database>();
        command = new DeleteFromDatabase(instance(database));
    });
    it('should delete all rows from the specified table', async function () {
        // when
        await executeAndReturnOutput(command, {table: table}).toPromise();
        // then
        verify(database.run(`DELETE FROM ${table}`)).once();
    });
    it('should delete rows from the specified table, that match the specified query', async function () {
        // given
        const query: any = {'a': 5};
        // when
        await executeAndReturnOutput(command, {table: table, query: query}).toPromise();
        // then
        verify(database.run(`DELETE FROM ${table} WHERE a = ?`, 5)).once();
    });
});
