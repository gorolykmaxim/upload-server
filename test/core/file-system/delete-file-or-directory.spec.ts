import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {Stats} from "fs";
import {DeleteFileOrDirectory} from "../../../backend/core/file-system/delete-file-or-directory";
import {executeAndReturnOutput} from "../../common";
import {betterMock} from "../../mock";

describe('DeleteFileOrDirectory', function () {
    const path: string = '/a/b/c';
    let stats: Stats;
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        stats = betterMock<Stats>();
        fileSystem = mock<FileSystem>();
        when(stats.isDirectory()).thenReturn(false);
        when(fileSystem.stat(path)).thenResolve(instance(stats));
        command = new DeleteFileOrDirectory(instance(fileSystem));
    });
    it('should remove specified file', async function () {
        // when
        await executeAndReturnOutput(command, {path: path}).toPromise();
        // then
        verify(fileSystem.unlink(path)).once();
    });
    it('should remove specified directory', async function () {
        // given
        when(stats.isDirectory()).thenReturn(true);
        // when
        await executeAndReturnOutput(command, {path: path}).toPromise();
        // then
        verify(fileSystem.rmdir(path, undefined)).once();
    });
});
