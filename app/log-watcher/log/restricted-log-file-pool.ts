import {LogFilePool} from "./log-file-pool";
import {LogFile} from "./log-file";
import {Collection} from "../../collection/collection";
import {LogFileFactory} from "./log-file-factory";

/**
 * Pool of log files, that allows to pool only certain log files.
 */
export class RestrictedLogFilePool extends LogFilePool {
    /**
     * Construct a pool.
     *
     * @param allowedLogFiles collection of absolute paths to log files, that are allowed to be pooled
     * @param logFiles collection, where the pool will store re-usable log files
     * @param factory factory, using which the pool will create new log files
     */
    constructor(private allowedLogFiles: Collection<string>, logFiles: Collection<LogFile>, factory: LogFileFactory) {
        super(logFiles, factory);
    }

    /**
     * {@inheritDoc}
     */
    async getLog(absoluteLogFilePath: string): Promise<LogFile> {
        if (!await this.allowedLogFiles.contains(absoluteLogFilePath)) {
            throw new LogFileAccessError(absoluteLogFilePath);
        }
        return super.getLog(absoluteLogFilePath);
    }
}

/**
 * An attempt was made to create a log file, access to which is prohibited by {@link RestrictedLogFileFactory}.
 */
export class LogFileAccessError extends Error {
    /**
     * Construct an error.
     *
     * @param absoluteLogFilePath absolute path to the log file, that has been attempted to be created
     */
    constructor(absoluteLogFilePath: string) {
        super(`Access to '${absoluteLogFilePath}' is prohibited`);
        Object.setPrototypeOf(this, LogFileAccessError.prototype);
    }
}