import {Dictionary} from "typescript-collections";
import {Process, ProcessErrorCode} from "../../../backend/core/process/base";
import {ChildProcess} from "child_process";
import {Command, CommandError} from "../../../backend/core/command/command";
import {instance, mock, verify} from "ts-mockito";
import {SendSignalToProcess} from "../../../backend/core/process/send-signal-to-process";
import {executeAndReturnOutput} from "../../common";
import {constants} from "os";
import { expect } from "chai";

describe('SendSignalToProcess', function () {
    const pid: number = 12345;
    let pidToProcess: Dictionary<number, Process>;
    let childProcess: ChildProcess;
    let command: Command;
    beforeEach(function () {
        pidToProcess = new Dictionary<number, Process>();
        childProcess = mock<ChildProcess>();
        pidToProcess.setValue(pid, new Process(instance(childProcess)));
        command = new SendSignalToProcess(pidToProcess);
    });
    it('should send the specified signal to the specified process', async function () {
        // when
        await executeAndReturnOutput(command, {pid: pid, signal: constants.signals.SIGINT}).toPromise();
        // then
        verify(childProcess.kill(constants.signals.SIGINT)).once();
    });
    it('should fail since the process with the specified PID does not exist', async function () {
        try {
            // when
            await executeAndReturnOutput(command, {pid: 5426, signal: constants.signals.SIGKILL}).toPromise();
        } catch (e) {
            // then
            expect(e).instanceOf(CommandError);
            expect(e.code).equal(ProcessErrorCode.processDoesNotExist);
        }
    });
});
