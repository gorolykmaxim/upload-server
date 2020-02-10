import {FileSystemCommand} from "./base";
import {Observable, Subscriber} from "rxjs";
import {CommandExecutor} from "../command/command-executor";
import {FileSystem} from "./file-system";
import {ACCESS_FILE, AccessFile} from "./access-file";
import {CREATE_DIRECTORY, CreateDirectory} from "./create-directory";
import {DELETE_FILE_OR_DIRECTORY, DeleteFileOrDirectory} from "./delete-file-or-directory";
import {GET_FILE_STATS, GetFileStats} from "./get-file-stats";
import {READ_FILE, ReadFile} from "./read-file";
import {RENAME_FILE, RenameFile} from "./rename-file";
import {WRITE_TO_FILE, WriteToFile} from "./write-to-file";

export const INITIALIZE_FILE_SYSTEM: string = 'initialize file-system';

/**
 * Initialize the file-system sub-system.
 */
export class InitializeFileSystem extends FileSystemCommand {
    /**
     * Construct a command.
     *
     * @param commandExecutor command executor to register file-system-related commands in
     * @param fileSystem file system to interact with
     */
    constructor(private commandExecutor: CommandExecutor, fileSystem: FileSystem) {
        super(fileSystem);
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.commandExecutor.register(ACCESS_FILE, new AccessFile(this.fileSystem));
        this.commandExecutor.register(CREATE_DIRECTORY, new CreateDirectory(this.fileSystem));
        this.commandExecutor.register(DELETE_FILE_OR_DIRECTORY, new DeleteFileOrDirectory(this.fileSystem));
        this.commandExecutor.register(GET_FILE_STATS, new GetFileStats(this.fileSystem));
        this.commandExecutor.register(READ_FILE, new ReadFile(this.fileSystem));
        this.commandExecutor.register(RENAME_FILE, new RenameFile(this.fileSystem));
        this.commandExecutor.register(WRITE_TO_FILE, new WriteToFile(this.fileSystem));
        output.complete();
    }
}
