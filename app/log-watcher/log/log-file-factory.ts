import {LogFile} from "./log-file";

/**
 * Factory of {@link LogFile}.
 */
export interface LogFileFactory {
    /**
     * Create a log file.
     *
     * @param absoluteLogFilePath absolute path to the created log file
     */
    create(absoluteLogFilePath: string): LogFile;
}