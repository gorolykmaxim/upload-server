import {Command, CommandError} from "../../../backend/core/command/command";
import {instance, mock, when} from "ts-mockito";
import {Dictionary} from "typescript-collections";
import {Process, ProcessErrorCode} from "../../../backend/core/process/base";
import {WatchProcessOutput} from "../../../backend/core/process/watch-process-output";
import {EOL} from "os";
import {expect} from "chai";
import {executeAndReturnOutput} from "../../common";
import {from, NEVER, Observable, of} from "rxjs";

describe('WatchProcessOutput', function () {
    const pid: number = 1234;
    const rawData: Array<string> = ['first', ` line${EOL}second `, 'li', `ne${EOL}`];
    let std: Observable<Buffer | string>;
    let process: Process;
    let pidToProcess: Dictionary<number, Process>;
    let command: Command;
    beforeEach(function () {
        std = from(rawData);
        process = mock(Process);
        when(process.stdoutData).thenReturn(std);
        when(process.stderrData).thenReturn(std);
        when(process.error).thenReturn(NEVER);
        when(process.close).thenReturn(NEVER);
        pidToProcess = new Dictionary<number, Process>();
        pidToProcess.setValue(pid, instance(process));
        command = new WatchProcessOutput(pidToProcess, EOL);
    });
    it('should fail to watch output of a process that does not run right now',async function () {
        try {
            // when
            await executeAndReturnOutput(command, {pid: 125432}).toPromise();
        } catch (e) {
            // then
            expect(e).instanceOf(CommandError);
            expect(e.code).equal(ProcessErrorCode.processDoesNotExist);
        }
    });
    it('should emit only complete lines from both STDOUT and STDERR', function (done) {
        // given
        const expectedLines: Array<string> = ['first line', 'second line'];
        const lines: Array<string> = [];
        // when
        executeAndReturnOutput(command, {pid: pid}).subscribe(line => {
            lines.push(line);
            if (lines.length === expectedLines.length) {
                expect(lines).eql(expectedLines);
                done();
            }
        });
    });
    it('should stop watching process output on process exit', async function () {
        // given
        when(process.close).thenReturn(of({}));
        // when
        await executeAndReturnOutput(command, {pid: pid}).toPromise();
    });
    it('should terminate its output with an error if process terminates with an error', async function () {
        // given
        when(process.error).thenReturn(of(new Error()));
        // then
        await expect(executeAndReturnOutput(command, {pid: pid}).toPromise()).rejectedWith(Error);
    });
});
