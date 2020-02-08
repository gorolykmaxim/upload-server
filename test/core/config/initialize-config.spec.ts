import {Command} from "../../../backend/core/command/command";
import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {anything, instance, mock, verify} from "ts-mockito";
import {JsonDB} from "node-json-db";
import {InitializeConfig} from "../../../backend/core/config/initialize-config";
import {READ_CONFIG} from "../../../backend/core/config/read-config";
import {MODIFY_CONFIG} from "../../../backend/core/config/modify-config";
import {executeAndReturnOutput} from "../../common";

describe('InitializeConfig', function () {
    let command: Command;
    let executor: CommandExecutor;
    let config: JsonDB;
    beforeEach(function () {
        executor = mock(CommandExecutor);
        config = mock(JsonDB);
        command = new InitializeConfig(instance(executor), instance(config));
    });
    it('should register all config-related commands', async function () {
        // when
        await executeAndReturnOutput(command).toPromise();
        // then
        verify(executor.register(READ_CONFIG, anything())).once();
        verify(executor.register(MODIFY_CONFIG, anything())).once();
    });
});
