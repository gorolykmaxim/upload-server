import {Command} from "../../../backend/core/command/command";
import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {anyOfClass, instance, mock, verify} from "ts-mockito";
import {JsonDB} from "node-json-db";
import {InitializeConfig} from "../../../backend/core/config/initialize-config";
import {READ_CONFIG, ReadConfig} from "../../../backend/core/config/read-config";
import {MODIFY_CONFIG, ModifyConfig} from "../../../backend/core/config/modify-config";
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
        verify(executor.register(READ_CONFIG, anyOfClass(ReadConfig))).once();
        verify(executor.register(MODIFY_CONFIG, anyOfClass(ModifyConfig))).once();
    });
});
