import {LegacyMessageFactory} from "./legacy-message-factory";
import {MessageFactory} from "./message-factory";
import {LogFile} from "../log/log-file";

/**
 * Factory that is used by default for all APIs of the current version of upload-server.
 */
export class DefaultMessageFactory extends LegacyMessageFactory implements MessageFactory {

    /**
     * {@inheritDoc}
     */
    createLogChangeMessage(logFile: LogFile, lines: Array<string>): string {
        return JSON.stringify({type: 'change', changes: lines});
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return 'DefaultMessageFactory{}';
    }
}