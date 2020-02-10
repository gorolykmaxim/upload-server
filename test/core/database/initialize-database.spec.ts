import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {Command} from "../../../backend/core/command/command";
import {anyOfClass, instance, mock, verify} from "ts-mockito";
import {InitializeDatabase} from "../../../backend/core/database/initialize-database";
import {executeAndReturnOutput} from "../../common";
import {SELECT_FROM_DATABASE, SelectFromDatabase} from "../../../backend/core/database/select-from-database";
import {INSERT_INTO_DATABASE, InsertIntoDatabase} from "../../../backend/core/database/insert-into-database";
import {DELETE_FROM_DATABASE, DeleteFromDatabase} from "../../../backend/core/database/delete-from-database";

describe('InitializeDatabase', function () {
    let executor: CommandExecutor;
    let command: Command;
    beforeEach(function () {
        executor = mock(CommandExecutor);
        command = new InitializeDatabase(instance(executor), null);
    });
    it('should register all database-related commands', async function () {
        // when
        await executeAndReturnOutput(command).toPromise();
        // then
        verify(executor.register(SELECT_FROM_DATABASE, anyOfClass(SelectFromDatabase))).once();
        verify(executor.register(INSERT_INTO_DATABASE, anyOfClass(InsertIntoDatabase))).once();
        verify(executor.register(DELETE_FROM_DATABASE, anyOfClass(DeleteFromDatabase))).once();
    });
});
