import {LogFileFactory} from "./log-file-factory";
import {LogFile} from "./log-file";

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

/**
 * Log file factory, that restrict access to log files and only allows to create those log files, that were
 * explicitly allowed to be created.
 */
export class RestrictedLogFileFactory implements LogFileFactory {
    /**
     * Construct a factory.
     *
     * @param factory a log file factory, to which this factory will delegate log file construction
     * @param allowedLogFilePaths collection of absolute paths to log files, that are permitted to be created
     */
    constructor(private factory: LogFileFactory, private allowedLogFilePaths: Set<string> = new Set()) {
    }

    /**
     * {@inheritDoc}
     */
    create(fileName: string): LogFile {
        if (!this.allowedLogFilePaths.has(fileName)) {
            throw new LogFileAccessError(fileName);
        }
        return this.factory.create(fileName);
    }
}