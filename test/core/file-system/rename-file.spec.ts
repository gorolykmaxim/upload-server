import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {RenameFile, RenameFileArgs} from "../../../backend/core/file-system/rename-file";
import {executeAndReturnOutput} from "../../common";

describe('RenameFile', function () {
    const args: RenameFileArgs = new RenameFileArgs('/a/b/c', '/d/e/f');
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        when(fileSystem.rename(args.oldPath, args.newPath)).thenResolve();
        command = new RenameFile(instance(fileSystem));
    });
    it('should rename the specified file', async function () {
        // when
        await executeAndReturnOutput(command, args).toPromise();
        // then
        verify(fileSystem.rename(args.oldPath, args.newPath)).once();
    });
});
