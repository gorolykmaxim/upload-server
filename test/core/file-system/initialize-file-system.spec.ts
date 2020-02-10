import {FileSystem} from "../../../backend/core/file-system/file-system";
import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {Command} from "../../../backend/core/command/command";
import {anyOfClass, instance, mock, verify} from "ts-mockito";
import {InitializeFileSystem} from "../../../backend/core/file-system/initialize-file-system";
import {executeAndReturnOutput} from "../../common";
import {ACCESS_FILE, AccessFile} from "../../../backend/core/file-system/access-file";
import {CREATE_DIRECTORY, CreateDirectory} from "../../../backend/core/file-system/create-directory";
import {
    DELETE_FILE_OR_DIRECTORY,
    DeleteFileOrDirectory
} from "../../../backend/core/file-system/delete-file-or-directory";
import {GET_FILE_STATS, GetFileStats} from "../../../backend/core/file-system/get-file-stats";
import {READ_FILE, ReadFile} from "../../../backend/core/file-system/read-file";
import {RENAME_FILE, RenameFile} from "../../../backend/core/file-system/rename-file";
import {WRITE_TO_FILE, WriteToFile} from "../../../backend/core/file-system/write-to-file";

describe('InitializeFileSystem', function () {
    let fileSystem: FileSystem;
    let executor: CommandExecutor;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        executor = mock(CommandExecutor);
        command = new InitializeFileSystem(instance(executor), instance(fileSystem));
    });
    it('should register all file-system-related commands', async function () {
        // when
        await executeAndReturnOutput(command).toPromise();
        // then
        verify(executor.register(ACCESS_FILE, anyOfClass(AccessFile))).once();
        verify(executor.register(CREATE_DIRECTORY, anyOfClass(CreateDirectory))).once();
        verify(executor.register(DELETE_FILE_OR_DIRECTORY, anyOfClass(DeleteFileOrDirectory))).once();
        verify(executor.register(GET_FILE_STATS, anyOfClass(GetFileStats))).once();
        verify(executor.register(READ_FILE, anyOfClass(ReadFile))).once();
        verify(executor.register(RENAME_FILE, anyOfClass(RenameFile))).once();
        verify(executor.register(WRITE_TO_FILE, anyOfClass(WriteToFile))).once();
    });
});
