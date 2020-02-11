import {CloseEvent, PidArgs, Process} from "../../../backend/core/process/base";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, when} from "ts-mockito";
import {WatchProcessStatus} from "../../../backend/core/process/watch-process-status";
import {Dictionary} from "typescript-collections";
import { expect } from "chai";
import {executeAndReturnOutput} from "../../common";
import {of} from "rxjs";

describe('WatchProcessStatus', function () {
    const pid: number = 12345;
    let pidToProcess: Dictionary<number, Process>;
    let process: Process;
    let command: Command;
    beforeEach(function () {
        pidToProcess = new Dictionary<number, Process>();
        process = mock(Process);
        pidToProcess.setValue(pid, instance(process));
        command = new WatchProcessStatus(pidToProcess);
    });
    it('should fail to watch status of the process that does not run right now', async function () {
        // then
        await expect(executeAndReturnOutput(command, new PidArgs(5342)).toPromise()).rejectedWith(Error);
    });
    it('should complete output with a close event', async function () {
        // given
        const event: CloseEvent = {code: 0, signal: null};
        when(process.closeOrError).thenReturn(of(event));
        // when
        const closeEvent: CloseEvent = await executeAndReturnOutput(command, new PidArgs(pid)).toPromise();
        // then
        expect(closeEvent).eql(event);
    });
    it('should successfully complete output with an error event', async function () {
        // given
        const error: Error = new Error();
        when(process.closeOrError).thenReturn(of(error));
        // when
        const errorEvent: Error =  await executeAndReturnOutput(command, new PidArgs(pid)).toPromise();
        // then
        expect(errorEvent).equal(error);
    });
});
