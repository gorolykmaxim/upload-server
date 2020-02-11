import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, verify} from "ts-mockito";
import {CreateDirectory} from "../../../backend/core/file-system/create-directory";
import {executeAndReturnOutput} from "../../common";

describe('CreateDirectory', function () {
    const path: string = '/a/b/c';
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        command = new CreateDirectory(instance(fileSystem));
    });
    it('should create a directory by the specified path', async function () {
        // when
        await executeAndReturnOutput(command, {path: path}).toPromise();
        // then
        verify(fileSystem.mkdir(path, undefined)).once();
    });
});
