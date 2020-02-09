import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {Command} from "../../../backend/core/command/command";
import {anything, instance, mock, verify} from "ts-mockito";
import {InitializeProcessing} from "../../../backend/core/process/initialize-processing";
import {executeAndReturnOutput} from "../../common";
import {CREATE_PROCESS} from "../../../backend/core/process/create-process";
import {SEND_SIGNAL_TO_PROCESS} from "../../../backend/core/process/send-signal-to-process";
import {WATCH_PROCESS_OUTPUT} from "../../../backend/core/process/watch-process-output";
import {EOL} from "os";
import {WATCH_PROCESS_STATUS} from "../../../backend/core/process/watch-process-status";

describe('InitializeProcessing', function () {
    let executor: CommandExecutor;
    let command: Command;
    beforeEach(function () {
        executor = mock(CommandExecutor);
        command = new InitializeProcessing(instance(executor), null, EOL);
    });
    it('should register all processing-related commands', async function () {
        // when
        await executeAndReturnOutput(command).toPromise();
        // then
        verify(executor.register(CREATE_PROCESS, anything())).once();
        verify(executor.register(SEND_SIGNAL_TO_PROCESS, anything())).once();
        verify(executor.register(WATCH_PROCESS_OUTPUT, anything())).once();
        verify(executor.register(WATCH_PROCESS_STATUS, anything())).once();
    });
});
