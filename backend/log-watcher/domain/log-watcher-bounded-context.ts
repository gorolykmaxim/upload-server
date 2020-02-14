import {AllowedLogFilesRepository} from "./allowed-log-files-repository";
import {FileSystem} from "./file-system";
import {LogFileAllowanceResult} from "./log-file-allowance-result";

/**
 * Bounded context of a log-watcher, module, that allows reading information about log files, and watching changes
 * in them in the real time.
 */
export class LogWatcherBoundedContext {
    /**
     * Construct a bounded context.
     *
     * @param allowedLogFilesRepository repository, that stores paths to log files, that are allowed to be watched
     * @param fileSystem the file system, on which the log files are located
     */
    constructor(private allowedLogFilesRepository: AllowedLogFilesRepository, private fileSystem: FileSystem) {
    }

    /**
     * Get list of absolute paths to log files, that can be watched and information about which can be read.
     */
    getLogFilesAllowedToBeWatched(): Array<string> {
        return this.allowedLogFilesRepository.findAll();
    }

    /**
     * Allow log file, located by the specified path to be watched. Return information about the result of an operation.
     *
     * @param absoluteLogFilePath absolute path to the log file
     */
    async allowLogFileToBeWatched(absoluteLogFilePath: string): Promise<LogFileAllowanceResult> {
        if (!this.allowedLogFilesRepository.contains(absoluteLogFilePath)) {
            this.allowedLogFilesRepository.add(absoluteLogFilePath);
        }
        try {
            await this.fileSystem.access(absoluteLogFilePath);
            return {};
        } catch (e) {
            return {notice: `Notice: the specified log file: '${absoluteLogFilePath}' currently does not exist.`};
        }
    }

    /**
     * Disallow log file, located by the specified path, to be watched.
     *
     * @param absoluteLogFilePath absolute path to the log file
     */
    disallowLogFileToBeWatched(absoluteLogFilePath: string): void {
        if (this.allowedLogFilesRepository.contains(absoluteLogFilePath)) {
            this.allowedLogFilesRepository.remove(absoluteLogFilePath);
        }
    }
}
