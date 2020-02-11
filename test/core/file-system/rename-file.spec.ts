import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {RenameFile} from "../../../backend/core/file-system/rename-file";
import {executeAndReturnOutput} from "../../common";

describe('RenameFile', function () {
    const oldPath: string = '/a/b/c';
    const newPath: string = '/d/e/f';
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        when(fileSystem.rename(oldPath, newPath)).thenResolve();
        command = new RenameFile(instance(fileSystem));
    });
    it('should rename the specified file', async function () {
        // when
        await executeAndReturnOutput(command, {oldPath: oldPath, newPath: newPath}).toPromise();
        // then
        verify(fileSystem.rename(oldPath, newPath)).once();
    });
});
