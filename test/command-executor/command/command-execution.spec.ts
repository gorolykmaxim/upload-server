import {constants, EOL} from "os";
import {
    CommandExecution,
    ExecutionStatus,
    FinalizationInWrongStateError,
    OnOutputLine, OnStatusChange, TerminationInWrongStateError
} from "../../../app/command-executor/command/command-execution";
import uuid = require("uuid");
import {Readable} from "stream";
import {ChildProcess} from "child_process";
import {capture, instance, mock, verify, when} from "ts-mockito";
import { expect } from "chai";

describe('CommandExecution', function () {
    const expectedError = new Error('Failed to start the process');
    const stdout = `stdout line 1${EOL}stdout line 2${EOL}`;
    const stdoutLines = stdout.split(EOL);
    stdoutLines.splice(stdoutLines.length - 1, 1);
    const stderr = `stderr line 1${EOL}stderr line 2${EOL}`;
    const stderrLines = stderr.split(EOL);
    stderrLines.splice(stderrLines.length - 1, 1);
    const totalLinesCount = stdoutLines.length + stderrLines.length;
    const commandId = uuid();
    const startTime = Date.now();
    let process: ChildProcess;
    let execution: CommandExecution;
    beforeEach(function () {
        const stdoutStream: Readable = new Readable();
        const stderrStream: Readable = new Readable();
        const streams: Array<Readable> = [stdoutStream, stderrStream];
        const outputs: Array<string> = [stdout, stderr];
        for (let i = 0; i < streams.length; i++) {
            let stream: Readable = streams[i];
            let output: string = outputs[i];
            stream.push(output.substring(0, 5));
            stream.push(output.substring(5, output.length));
            stream.push(null);
        }
        process = mock<ChildProcess>();
        when(process.stdout).thenReturn(stdoutStream);
        when(process.stderr).thenReturn(stderrStream);
        execution = CommandExecution.new(commandId, startTime, instance(process), EOL);
    });
    it('should start in an executing state', function () {
        // then
        expect(execution.getStatus()).to.equal(ExecutionStatus.executing);
    });
    it('should have no output lines at the beginning', function () {
        // then
        expect(execution.getOutputLines()).to.eql([]);
    });
    it('should notify listeners about changes in the commands output', async function () {
        // when
        const linesReceived = await flushAllOutputEvents(execution, totalLinesCount);
        // then
        expect(linesReceived).to.include.members(stdoutLines);
        expect(linesReceived).to.include.members(stderrLines);
    });
    it('should not notify output listeners, that have been removed', function (done) {
        // given
        const listenerThatShouldNotBeCalled: OnOutputLine = line => done(new Error('This listener should not be called'));
        // when
        execution.addOutputListener(listenerThatShouldNotBeCalled);
        execution.removeOutputListener(listenerThatShouldNotBeCalled);
        flushAllOutputEvents(execution, totalLinesCount).then(lines => done());
    });
    it('should not notify status listeners, that have been removed', function (done) {
        // given
        const finish: Function = capture(process.on).last()[1];
        const listenerThatShouldNotBeCalled: OnStatusChange = status => done(new Error('This listener should not be called'));
        // when
        execution.addStatusListener(listenerThatShouldNotBeCalled);
        execution.removeStatusListener(listenerThatShouldNotBeCalled);
        finish(0, null);
        done();
    });
    it('should return all of its current output as a single string', async function () {
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const output: string = execution.getOutputAsString();
        // then
        expect(output).to.equal(stdout + stderr.substring(0, stderr.length - 1));
    });
    it('should return all of its current output as an array of output lines', async function () {
        // given
        const expectedLines: Array<string> = [];
        expectedLines.push(...stdoutLines);
        expectedLines.push(...stderrLines);
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const outputLines: Array<string> = execution.getOutputLines();
        // then
        expect(outputLines).to.eql(expectedLines);
    });
    it('should notify status listeners about a change on exit with a 0 code', async function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const statusesPromise: Promise<Array<ExecutionStatus>> = flushAllStatusEvents(execution, 1);
        finish(0, null);
        // then
        const status: ExecutionStatus = (await statusesPromise)[0];
        const outputLines: Array<string> = execution.getOutputLines();
        const lastOutputLine: string = outputLines[outputLines.length - 1];
        expect(status).to.equal(ExecutionStatus.finished);
        expect(lastOutputLine).to.equal('Process exited with code 0');
    });
    it('should change its status on exit with a 0 code', function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        finish(0, null);
        const status: ExecutionStatus = execution.getStatus();
        // then
        expect(status).to.equal(ExecutionStatus.finished);
    });
    it('should notify status listeners about a change on exit with a non-0 code', async function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const statusesPromise: Promise<Array<ExecutionStatus>> = flushAllStatusEvents(execution, 1);
        finish(1, null);
        // then
        const status: ExecutionStatus = (await statusesPromise)[0];
        const outputLines: Array<string> = execution.getOutputLines();
        const lastOutputLine: string = outputLines[outputLines.length - 1];
        expect(status).to.equal(ExecutionStatus.failed);
        expect(lastOutputLine).to.equal('Process exited with code 1');
    });
    it('should change its status on exit with a non-0 code', function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        finish(1, null);
        const status: ExecutionStatus = execution.getStatus();
        // then
        expect(status).to.equal(ExecutionStatus.failed);
    });
    it('should notify status listeners about a change on signal termination', async function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const statusesPromise: Promise<Array<ExecutionStatus>> = flushAllStatusEvents(execution, 1);
        finish(null, constants.signals.SIGINT);
        // then
        const status: ExecutionStatus = (await statusesPromise)[0];
        const outputLines: Array<string> = execution.getOutputLines();
        const lastOutputLine: string = outputLines[outputLines.length - 1];
        expect(status).to.equal(ExecutionStatus.failed);
        expect(lastOutputLine).to.equal(`The process was terminated with a signal '${constants.signals.SIGINT}'`);
    });
    it('should change its status on signal termination', function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        // when
        finish(null, constants.signals.SIGINT);
        const status: ExecutionStatus = execution.getStatus();
        // then
        expect(status).to.equal(ExecutionStatus.failed);
    });
    it('should notify status listeners about a change on failure', async function () {
        // given
        const error: Function = capture(process.on).first()[1];
        // when
        await flushAllOutputEvents(execution, totalLinesCount);
        const statusesPromise: Promise<Array<ExecutionStatus>> = flushAllStatusEvents(execution, 1);
        error(expectedError);
        // then
        const status: ExecutionStatus = (await statusesPromise)[0];
        const outputLines: Array<string> = execution.getOutputLines();
        const lastOutputLine: string = outputLines[outputLines.length - 1];
        expect(status).to.equal(ExecutionStatus.failed);
        expect(lastOutputLine).to.equal(expectedError.message);
    });
    it('should change its status on failure', function () {
        // given
        const error: Function = capture(process.on).first()[1];
        // when
        error(expectedError);
        const status: ExecutionStatus = execution.getStatus();
        // then
        expect(status).to.equal(ExecutionStatus.failed);
    });
    it('should stop notifying listeners about any changes after finalization', function (done) {
        // given
        const finish: Function = capture(process.on).last()[1];
        finish(0, null);
        execution.addOutputListener(line => done(new Error('Output listeners should not be called after finalization')));
        execution.addStatusListener(line => done(new Error('Output listeners should not be called after finalization')));
        // when
        execution.finalize();
        // then
        done();
    });
    it('should not finalize itself if it is not over', function () {
        // then
        expect(() => execution.finalize()).to.throw(FinalizationInWrongStateError);
    });
    it('should send SIGINT signal to the executing process', function () {
        // when
        execution.terminate();
        // then
        verify(process.kill(constants.signals.SIGINT)).once();
    });
    it('should not send SIGINT signal if it is over', function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        finish(0, null);
        // then
        expect(() => execution.terminate()).to.throw(TerminationInWrongStateError);
    });
    it('should send SIGKILL signal to the executing process', function () {
        // when
        execution.halt();
        // then
        verify(process.kill(constants.signals.SIGKILL)).once();
    });
    it('should not send SIGKILL signal if it is over', function () {
        // given
        const finish: Function = capture(process.on).last()[1];
        finish(0, null);
        // then
        expect(() => execution.halt()).to.throw(TerminationInWrongStateError);
    });
});

function flushAllOutputEvents(execution: CommandExecution, expectedLinesCount: number): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        const lines: Array<string> = [];
        execution.addOutputListener(line => {
            lines.push(line);
            if (lines.length === expectedLinesCount) {
                resolve(lines);
            }
        });
    });
}

function flushAllStatusEvents(execution: CommandExecution, expectedEventsCount: number): Promise<Array<ExecutionStatus>> {
    return new Promise((resolve, reject) => {
        const statuses: Array<ExecutionStatus> = [];
        execution.addStatusListener(status => {
            statuses.push(status);
            if (statuses.length === expectedEventsCount) {
                resolve(statuses);
            }
        });
    });
}