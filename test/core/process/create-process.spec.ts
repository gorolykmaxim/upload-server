import {ChildProcess} from "child_process";
import {Dictionary} from "typescript-collections";
import {Process} from "../../../backend/core/process/base";
import {Command} from "../../../backend/core/command/command";
import {anything, instance, mock, verify, when} from "ts-mockito";
import {CreateProcess} from "../../../backend/core/process/create-process";
import {executeAndReturnOutput} from "../../common";
import { expect } from "chai";
import {Writable} from "stream";
import {EOL} from "os";
import {from, Observable, throwError} from "rxjs";

describe('CreateProcess', function () {
    const actualCommand: string = 'yes';
    const pid: number = 12345;
    let stdin: Writable;
    let childProcess: ChildProcess;
    let pidToProcess: Dictionary<number, Process>;
    let command: Command;
    beforeEach(function () {
        pidToProcess = new Dictionary<number, Process>();
        childProcess = mock<ChildProcess>();
        stdin = mock(Writable);
        when(childProcess.pid).thenReturn(pid);
        when(childProcess.stdin).thenReturn(instance(stdin));
        command = new CreateProcess((command1, args, options) => {
            if (command1 === actualCommand) {
                return instance(childProcess);
            }
        }, pidToProcess);
    });
    it('should start a process for the specified command and return PID', async function () {
        // when
        const actualPID: number = await executeAndReturnOutput(command, {command: actualCommand}).toPromise();
        // then
        expect(actualPID).equal(pid);
    });
    it('should save the process to the data structure', async function () {
        // when
        await executeAndReturnOutput(command, {command: actualCommand}).toPromise();
        // then
        expect(pidToProcess.getValue(pid)).eql({childProcess: instance(childProcess)});
    });
    it('should write input to the STDIN of the created process', async function () {
        // given
        const expectedLines: Array<string> = [`line 1${EOL}`, `line 2${EOL}`];
        const input: Observable<string> = from(expectedLines);
        // when
        await executeAndReturnOutput(command, {command: actualCommand}, input).toPromise();
        // then
        verify(stdin.write(expectedLines[0])).calledBefore(stdin.write(expectedLines[1]));
        verify(stdin.write(expectedLines[1])).calledBefore(stdin.end());
        verify(stdin.end()).once();
    });
    it('should close STDIN of the create process on an error from the commands input', async function () {
        // when
        await executeAndReturnOutput(command, {command: actualCommand}, throwError(new Error())).toPromise();
        // then
        verify(stdin.write(anything())).never();
        verify(stdin.end()).once();
    });
});
