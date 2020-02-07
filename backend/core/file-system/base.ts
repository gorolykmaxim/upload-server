import {Command} from "../command/command";
import {FileSystem} from "./file-system";

/**
 * Base class for all file-system-related commands.
 */
export abstract class FileSystemCommand extends Command {
    /**
     * Construct a command.
     *
     * @param fileSystem file system to interact with
     */
    constructor(protected fileSystem: FileSystem) {
        super();
    }
}
