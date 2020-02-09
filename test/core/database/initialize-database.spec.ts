import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {Command} from "../../../backend/core/command/command";
import {anything, instance, mock, verify} from "ts-mockito";
import {InitializeDatabase} from "../../../backend/core/database/initialize-database";
import {executeAndReturnOutput} from "../../common";
import {SELECT_FROM_DATABASE} from "../../../backend/core/database/select-from-database";
import {INSERT_INTO_DATABASE} from "../../../backend/core/database/insert-into-database";
import {DELETE_FROM_DATABASE} from "../../../backend/core/database/delete-from-database";

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
        verify(executor.register(SELECT_FROM_DATABASE, anything())).once();
        verify(executor.register(INSERT_INTO_DATABASE, anything())).once();
        verify(executor.register(DELETE_FROM_DATABASE, anything())).once();
    });
});
