import {Collection, EntityNotFoundError} from "../../common/collection/collection";
import {LogFile} from "./log-file";
import {LogFileFactory} from "./log-file-factory";

/**
 * Pool of log files, that are currently being watched by somebody.
 * Depending on a situation, creating a log file instance might be expensive, so log file instances
 * are re-used across different watchers, meaning a single log file can be watched by multiple watchers at the same
 * time.
 */
export class LogFilePool {
    /**
     * Construct a log file pool.
     *
     * @param logFiles collection, where the pool will store re-usable log files
     * @param factory factory, using which the pool will create new log files
     */
    constructor(private logFiles: Collection<LogFile>, private factory: LogFileFactory) {
    }

    /**
     * Return instance of a log file, located by the specified path.
     * If the pool does not have such log file - it will create a new one. If the pool already has a fitting
     * log file instance - it will return it instead.
     *
     * @param absoluteLogFilePath absolute path to the log file
     */
    async getLog(absoluteLogFilePath: string): Promise<LogFile> {
        let logFile: LogFile;
        if (await this.logFiles.contains(absoluteLogFilePath)) {
            logFile = await this.logFiles.findById(absoluteLogFilePath);
        } else {
            logFile = this.factory.create(absoluteLogFilePath);
            await this.logFiles.add(logFile);
        }
        return logFile;
    }

    /**
     * Remove all of the specified log files, that have no active watchers and can be freed, from the pool, while
     * disposing all the associated resources.
     *
     * @param logFiles log files to try to dispose
     */
    async disposeAllIfNecessary(logFiles: Array<LogFile>): Promise<void> {
        await Promise.all(logFiles.map(this.disposeIfNecessary.bind(this)));
    }

    /**
     * Close the specified log file if it has no active watchers. If the log file has active watcher - this method
     * call will be ignored.
     * Only log files, that belong to this pool, can be disposed by this pool.
     *
     * @param logFile log file to try to dispose
     */
    async disposeIfNecessary(logFile: LogFile): Promise<void> {
        try {
            if (!logFile.hasContentChangesListeners()) {
                await this.logFiles.remove(logFile);
                logFile.close();
            }
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                e = new LogFileDoesNotBelongToThePoolError(logFile);
            }
            throw new LogFileCantBeDisposedError(logFile, e);
        }
    }
}

/**
 * Generic log file pool error.
 */
export class LogFilePoolError extends Error {
    /**
     * Construct an error.
     *
     * @param message error message
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, LogFilePool.prototype);
    }
}

/**
 * Specified log file does not belong to the pool, that has thrown this error.
 */
export class LogFileDoesNotBelongToThePoolError extends LogFilePoolError {
    /**
     * Construct an error.
     *
     * @param logFile log file, that does not belong to the pool
     */
    constructor(logFile: LogFile) {
        super(`${logFile} does not belong to the pool.`);
        Object.setPrototypeOf(this, LogFileDoesNotBelongToThePoolError.prototype);
    }
}

/**
 * Specified log file can't be disposed by the pool, that has thrown this error.
 */
export class LogFileCantBeDisposedError extends LogFilePoolError {
    /**
     * Construct an error.
     *
     * @param logFile log file, that was not disposed
     * @param cause reason why the file was not disposed
     */
    constructor(logFile: LogFile, cause: Error) {
        super(`${logFile} can't be disposed by the pool. Reason: ${cause}`);
        Object.setPrototypeOf(this, LogFileCantBeDisposedError.prototype);
    }
}