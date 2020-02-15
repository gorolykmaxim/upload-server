import {AllowedLogFilesRepository} from "./allowed-log-files-repository";
import {FileSystem} from "./file-system";
import {Stats} from "fs";
import {EOL} from "os";
import {Observable, throwError} from "rxjs";
import {FileWatcher} from "./file-watcher";
import {catchError, map} from "rxjs/operators";

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
     * @param fileWatcher a file watcher, that will be used to watch changes in the log files
     */
    constructor(private allowedLogFilesRepository: AllowedLogFilesRepository, private fileSystem: FileSystem,
                private fileWatcher: FileWatcher) {
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

    /**
     * Watch content changes in the log file, located by the specified path.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param includeFileName include name of the file {@link LogFileChanges}, coming from the returned observable.
     * @param fromTheBeginning if set to true - this call will first read all the existing contents of the specified
     * log, emit them to the returned observable and only after that will start to listen to new content changes,
     * happening in the specified log
     */
    watchLogFileContent(absoluteLogFilePath: string, includeFileName: boolean = false, fromTheBeginning: boolean = false): Observable<LogFileChanges> {
        if (!this.allowedLogFilesRepository.contains(absoluteLogFilePath)) {
            throw new LogFileAccessError(absoluteLogFilePath);
        }
        return new Observable<LogFileChanges>(subscriber => {
            let whenReady: Promise<void>;
            if (fromTheBeginning) {
                whenReady = this.getLogFileContent(absoluteLogFilePath, false)
                    .then(content => subscriber.next(includeFileName ? {changes: content.content as Array<string>, file: absoluteLogFilePath} : {changes: content.content as Array<string>}));
            } else {
                whenReady = Promise.resolve();
            }
            whenReady.then(() => {
                this.fileWatcher.watch(absoluteLogFilePath)
                    .pipe(
                        map<string, LogFileChanges>(line => includeFileName ? {changes: [line], file: absoluteLogFilePath} : {changes: [line]}),
                        catchError(error => throwError(new LogFileOperationError('watch content changes in', absoluteLogFilePath, error)))
                    )
                    .subscribe(subscriber);
            }).catch(e => subscriber.error(e));
        });
    }
}

export interface LogFileAllowanceResult {
    notice?: string;
}

export interface LogFileChanges {
    changes: Array<string>,
    file?: string
}

export interface LogFileContent {
    content: Array<string> | string;
}

export interface LogFileSize {
    sizeInBytes: number;
}

export class LogFileAccessError extends Error {
    constructor(absolutePathToLogFile: string) {
        super(`Access to ${absolutePathToLogFile} is forbidden`);
        Object.setPrototypeOf(this, LogFileAccessError.prototype);
    }
}

export class LogFileOperationError extends Error {
    constructor(operation: string, absolutePathToLogFile: string, cause: Error) {
        super(`Failed to ${operation} log file ${absolutePathToLogFile}. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, LogFileOperationError.prototype);
    }
}
