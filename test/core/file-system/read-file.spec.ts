import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {deepEqual, instance, mock, when} from "ts-mockito";
import {ReadFile} from "../../../backend/core/file-system/read-file";
import {executeAndReturnOutput} from "../../common";
import { expect } from "chai";

describe('ReadFile', function () {
    const data: Buffer = Buffer.from('fbasdblgasdh');
    const path: string = '/a/b/c';
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        when(fileSystem.readFile(path, deepEqual({path: path}))).thenResolve(data);
        command = new ReadFile(instance(fileSystem));
    });
    it('should read data from file, convert it to string and return it', async function () {
        // when
        const actualData: string = await executeAndReturnOutput(command, {path: path}).toPromise();
        // then
        expect(actualData).equal(data.toString());
    });
});