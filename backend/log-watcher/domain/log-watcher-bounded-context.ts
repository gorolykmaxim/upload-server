import {AllowedLogFilesRepository} from "./allowed-log-files-repository";
import {FileSystem} from "./file-system";
import {LogFileAllowanceResult} from "./log-file-allowance-result";
import {LogFileAccessError} from "./log-file-access-error";
import {Stats} from "fs";
import {LogFileOperationError} from "./log-file-operation-error";
import {LogFileContent} from "./log-file-content";
import {EOL} from "os";
import {LogFileSize} from "./log-file-size";

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

    /**
     * Read size of the log file, located by the specified path.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @throws LogFileAccessError if the specified log file is not allowed to be watched
     * @throws LogFileOperationError if the size of the specified log file can't be read for some unforeseen reason
     */
    async getLogFileSize(absoluteLogFilePath: string): Promise<LogFileSize> {
        if (!this.allowedLogFilesRepository.contains(absoluteLogFilePath)) {
            throw new LogFileAccessError(absoluteLogFilePath);
        }
        try {
            const logFileStats: Stats = await this.fileSystem.stat(absoluteLogFilePath);
            return {sizeInBytes: logFileStats.size};
        } catch (e) {
            throw new LogFileOperationError('get size of', absoluteLogFilePath, e);
        }
    }

    /**
     * Read content of the log file, located by the specified path.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param dontSplit if set to true - the content will be returned as a single string. Otherwise - the content
     * will be split in lines.
     * @throws LogFileAccessError if the specified log file is not allowed to be watched
     * @throws LogFileOperationError if the content of the specified log file can't be read for some unforeseen reason
     */
    async getLogFileContent(absoluteLogFilePath: string, dontSplit: boolean): Promise<LogFileContent> {
        if (!this.allowedLogFilesRepository.contains(absoluteLogFilePath)) {
            throw new LogFileAccessError(absoluteLogFilePath);
        }
        try {
            const logFileContent: string = (await this.fileSystem.readFile(absoluteLogFilePath)).toString();
            return {content: dontSplit ? logFileContent : logFileContent.split(EOL)};
        } catch (e) {
            throw new LogFileOperationError('read content of', absoluteLogFilePath, e);
        }
    }
}
