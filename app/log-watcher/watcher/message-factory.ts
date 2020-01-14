import {LogFile} from "../log/log-file";

/**
 * Factory of message, that watcher will be sending to the actual API client.
 */
export interface MessageFactory {
    /**
     * Create a message about changes in a log file.
     *
     * @param logFile log file, content of which has changed
     * @param lines new lines, that were added to the log file
     */
    createLogChangeMessage(logFile: LogFile, lines: Array<string>): string;

    /**
     * Create a message about an error, that occurred while listening to changes in a log file.
     *
     * @param error error that happened
     */
    createErrorMessage(error: Error): string;
}