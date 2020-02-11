import {Command} from "../../../backend/core/command/command";
import {Database} from "sqlite";
import {instance, mock, verify} from "ts-mockito";
import {InsertIntoDatabase} from "../../../backend/core/database/insert-into-database";
import {executeAndReturnOutput} from "../../common";
import {from} from "rxjs";
import {TableArgs} from "../../../backend/core/database/base";

describe('InsertIntoDatabase', function () {
    const table: string = 'my_table';
    let database: Database;
    let command: Command;
    beforeEach(function () {
        database = mock<Database>();
        command = new InsertIntoDatabase(instance(database));
    });
    it('should insert elements from the input into the database', async function () {
        // given
        const elementsToInsert: Array<any> = [
            {'a': 15, 'b': 'c'},
            {'a': 16, 'b': 'd'}
        ];
        // when
        await executeAndReturnOutput(command, new TableArgs(table), from(elementsToInsert)).toPromise();
        // then
        verify(database.run(`INSERT INTO ${table}(a, b) VALUES(?, ?)`, 15, 'c')).once();
        verify(database.run(`INSERT INTO ${table}(a, b) VALUES(?, ?)`, 16, 'd')).once();
    });
});
