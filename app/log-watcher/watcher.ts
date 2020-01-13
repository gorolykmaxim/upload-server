import {ContentError, LogFile, LogFileCollection} from "./log";
import {Collection, EntityComparison, EntityNotFoundError, InMemoryCollection} from "../collection";
import WebSocket = require("ws");

/**
 * Factory-method that returns a new UUID in as a string.
 */
export type CreateUUID = () => string;

/**
 * An API client, that watches for changes in log files.
 */
export class Watcher {
    private watchedLogs: Collection<LogFile> = new LogFileCollection();

    /**
     * Construct a watcher.
     *
     * @param id unique ID of this watcher
     * @param connection websocket connection, the client, represented by this watcher, uses to interact with API
     * @param messageFactory message factory, that will be used by the watcher to construct messages, that the watcher
     * will send back to the actual API client
     */
    constructor(public id: string, private connection: WebSocket, private messageFactory: MessageFactory) {
    }

    /**
     * Start watching for changes in the specified log file: the watcher will be notifying the actual API client about
     * every new line being added to the specified log file.
     * A watcher can't watch the same log file twice.
     *
     * @param logFile log file, changes of which will be watched
     */
    async watchLog(logFile: LogFile): Promise<void> {
        if (await this.watchedLogs.contains(logFile.absolutePath)) {
            throw new CantWatchLogMultipleTimesError(this, logFile);
        }
        logFile.addContentChangesListener(line => this.notifyAboutChangeIn(logFile, [line]));
        await this.watchedLogs.add(logFile);
    }

    /**
     * Read all the contents of the specified log file and send them to the actual API client. Notify API client, if
     * read operation will fail for some reason.
     *
     * @param logFile log file to read
     */
    async readFromTheBeginning(logFile: LogFile): Promise<void> {
        try {
            this.notifyAboutChangeIn(logFile, await logFile.getContentLines());
        } catch (e) {
            if (e instanceof ContentError) {
                this.notifyAboutError(e);
            }
            throw e;
        }
    }

    /**
     * Start watching for changes in the specified log file from the beginning: first send existing contents of the
     * log file to the API client and after that - notify the client each time a new line gets added to the log file.
     * Any kind of error, that will occur in the process, will get send to the client.
     * If the watcher will fail to start watching the changes in the log file - it will not attempt to read the existing
     * log file content.
     *
     * @param logFile log file to watch
     */
    async watchFromTheBeginning(logFile: LogFile): Promise<void> {
        await this.watchLog(logFile);
        await this.readFromTheBeginning(logFile);
    }

    /**
     * Stop watching changes in the specified log file.
     * In order for this method not to fail, the watcher should be already watching the specified log file.
     *
     * @param logFile log file to stop watching
     */
    async stopWatchingLog(logFile: LogFile): Promise<void> {
        try {
            logFile.removeContentChangesListener(line => this.notifyAboutChangeIn(logFile, [line]));
            await this.watchedLogs.remove(logFile);
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                e = new WatcherIsNotWatchingLogFileError(this, logFile);
                this.notifyAboutError(e);
            }
            throw e;
        }
    }

    /**
     * Notify the watcher about an error.
     *
     * @param error error that needs to be send to watcher
     */
    notifyAboutError(error: Error) {
        this.connection.send(this.messageFactory.createErrorMessage(error));
    }

    /**
     * Stop watching changes in all the log files, the watcher is currently watching, and return those log files.
     */
    async stopWatchingLogs(): Promise<Array<LogFile>> {
        const watchedLogs = await this.watchedLogs.findAll();
        await Promise.all(watchedLogs.map(this.stopWatchingLog.bind(this)));
        return watchedLogs;
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return `Watcher{id=${this.id}, messageFactory=${this.messageFactory}}`;
    }

    private notifyAboutChangeIn(logFile: LogFile, changes: Array<string>) {
        this.connection.send(this.messageFactory.createLogChangeMessage(logFile, changes));
    }
}

/**
 * Watcher has failed to start watching for changes in a log file's content since the watcher has been already watching
 * this log file.
 */
export class CantWatchLogMultipleTimesError extends Error {
    /**
     * Construct an error.
     *
     * @param watcher watcher that has attempted to watch the same log file times
     * @param logFile log file
     */
    constructor(watcher: Watcher, logFile: LogFile) {
        super(`${watcher} is already watching the ${logFile}`);
        Object.setPrototypeOf(this, CantWatchLogMultipleTimesError.prototype);
    }
}

/**
 * Watcher has failed to stop watching for changes in a log file's content since the watcher was not watching the log
 * file in the first place.
 */
export class WatcherIsNotWatchingLogFileError extends Error {
    /**
     * Construct an error.
     *
     * @param watcher watcher, that has attempted to stop watching the log
     * @param logFile log file
     */
    constructor(watcher: Watcher, logFile: LogFile) {
        super(`${watcher} is not watching the ${logFile}`);
        Object.setPrototypeOf(this, WatcherIsNotWatchingLogFileError.prototype);
    }
}

/**
 * Factory of {@link Watcher}.
 */
export class WatcherFactory {
    /**
     * Construct a factory.
     *
     * @param createUUID factory-method to create a new UUID
     * @param messageFactory factory, that will be used to create messages, that will be sent from watchers to API
     * clients
     */
    constructor(private createUUID: CreateUUID, private messageFactory: MessageFactory) {
    }

    /**
     * Create a watcher, that will represent an API client, connected via specified connection.
     *
     * @param connection connection of the API client, that corresponds to the created watcher
     */
    create(connection: WebSocket): Watcher {
        return new Watcher(this.createUUID(), connection, this.messageFactory);
    }
}

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

/**
 * Collection of watchers.
 */
export class WatcherCollection extends InMemoryCollection<Watcher> {
    /**
     * Construct a collection.
     */
    constructor() {
        super(new WatcherComparison());
    }
}

/**
 * Comparison of watchers and their IDs.
 */
export class WatcherComparison implements EntityComparison<Watcher> {
    /**
     * {@inheritDoc}
     */
    equal(entity: Watcher, anotherEntity: Watcher): boolean {
        return entity.id === anotherEntity.id;
    }

    /**
     * {@inheritDoc}
     */
    hasId(entity: Watcher, id: any): boolean {
        return entity.id === id;
    }

}