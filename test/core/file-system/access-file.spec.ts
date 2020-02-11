import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, when} from "ts-mockito";
import {AccessFile} from "../../../backend/core/file-system/access-file";
import {executeAndReturnOutput} from "../../common";
import { expect } from "chai";

describe('AccessFile', function () {
    const path: string = '/a/b/c';
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        when(fileSystem.access(path, undefined)).thenResolve();
        command = new AccessFile(instance(fileSystem));
    });
    it('should successfully access specified file', async function () {
        // when
        await executeAndReturnOutput(command, {path: path}).toPromise();
    });
    it('should fail to access the specified file and throw an error', async function () {
        // given
        when(fileSystem.access(path, undefined)).thenReject(new Error());
        // then
        await expect(executeAndReturnOutput(command, {path: path}).toPromise()).rejectedWith(Error);
    });
});
