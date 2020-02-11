import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {WriteToFile} from "../../../backend/core/file-system/write-to-file";
import {WriteStream} from "fs";
import {from, Observable, throwError} from "rxjs";
import {executeAndReturnOutput} from "../../common";
import {expect} from "chai";

describe('WriteToFile', function () {
    const path: string = '/a/b/c';
    let writeStream: WriteStream;
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        writeStream = mock(WriteStream);
        fileSystem = mock<FileSystem>();
        when(fileSystem.createWriteStream(path, undefined)).thenReturn(instance(writeStream));
        command = new WriteToFile(instance(fileSystem));
    });
    it('should write the input to the file and complete successfully', async function () {
        // given
        const expectedLines: Array<string> = ['first line', 'second line', 'third line'];
        const input: Observable<string> = from(expectedLines);
        // when
        await executeAndReturnOutput(command, {path: path}, input).toPromise();
        // then
        verify(writeStream.write(expectedLines[0])).calledBefore(writeStream.write(expectedLines[1]));
        verify(writeStream.write(expectedLines[1])).calledBefore(writeStream.write(expectedLines[2]));
        verify(writeStream.write(expectedLines[2])).calledBefore(writeStream.end());
        verify(writeStream.end()).once();
    });
    it('should write the input to the file and forward the error from the input to the output', async function () {
        // then
        await expect(executeAndReturnOutput(command, {path: path}, throwError(new Error())).toPromise()).rejectedWith(Error);
        verify(writeStream.end()).once();
    });
});
