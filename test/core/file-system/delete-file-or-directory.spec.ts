import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {Stats} from "fs";
import {DeleteFileOrDirectory} from "../../../backend/core/file-system/delete-file-or-directory";
import {betterMock, executeAndReturnOutput} from "../../common";
import {PathWithOptionsArgs} from "../../../backend/core/file-system/base";

describe('DeleteFileOrDirectory', function () {
    const args: PathWithOptionsArgs = new PathWithOptionsArgs('/a/b/c');
    let stats: Stats;
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        stats = betterMock<Stats>();
        fileSystem = mock<FileSystem>();
        when(stats.isDirectory()).thenReturn(false);
        when(fileSystem.stat(args.path)).thenResolve(instance(stats));
        command = new DeleteFileOrDirectory(instance(fileSystem));
    });
    it('should remove specified file', async function () {
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(fileSystem.unlink(args.path)).once();
    });
    it('should remove specified directory', async function () {
        // given
        when(stats.isDirectory()).thenReturn(true);
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(fileSystem.rmdir(args.path, args.options)).once();
    });
});
