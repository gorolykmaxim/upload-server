import {MessageFactory} from "./message-factory";
import {LogFile} from "../log/log-file";

/**
 * Factory that uses a message format of a previous versions of the upload-server.
 */
export class LegacyMessageFactory implements MessageFactory {

    /**
     * {@inheritDoc}
     */
    createErrorMessage(error: Error): string {
        return JSON.stringify({type: 'error', message: error.message});
    }

    /**
     * {@inheritDoc}
     */
    createLogChangeMessage(logFile: LogFile, lines: Array<string>): string {
        return JSON.stringify({type: 'change', file: logFile.absolutePath, changes: lines});
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return 'LegacyMessageFactory{}';
    }
}