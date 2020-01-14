import {Server} from "ws";
import WebSocket = require("ws");
import {Collection} from "../../collection/collection";
import {WatcherFactory} from "../watcher/watcher-factory";
import {LogFilePool} from "../log/log-file-pool";
import {Watcher} from "../watcher/watcher";
import {LogFileAccessError} from "../log/restricted-log-file-factory";
import {LogFile} from "../log/log-file";

/**
 * Log-watcher API, used in previous versions of upload-server. The API is still available for backward-compatibility
 * purposes, since the changes are there are a bunch of folks still using it in their automated scripts.
 */
export class LegacyAPI {
    /**
     * Construct an API.
     *
     * @param allowedLogFiles collection of absolute paths to log files, that are allowed to be watched
     * @param logFilePool pool of log files to obtain references to watchable log files from
     * @param watcherFactory factory to use to create watchers for incoming client connection
     * @param server server to listen to incoming websocket connection on
     */
    constructor(private allowedLogFiles: Collection<string>,
                private logFilePool: LogFilePool, private watcherFactory: WatcherFactory, server: Server) {
        server.on('connection', this.handleConnectionOpening.bind(this));
    }

    private handleConnectionOpening(connection: WebSocket): void {
        const watcher = this.watcherFactory.create(connection);
        connection.on('message', message => this.handleMessage(message.toString(), watcher));
        connection.on('close', () => this.handleConnectionClosure(watcher));
    }

    private async handleMessage(rawMessage: string, watcher: Watcher): Promise<void> {
        try {
            let {type, file, fromStart} = JSON.parse(rawMessage);
            if (!file) {
                throw new FileNameMissingError();
            }
            switch (type) {
                case MessageTypes.WATCH:
                    await this.handleWatchMessage(file, watcher, fromStart);
                    break;
                case MessageTypes.UNWATCH:
                    await this.handleUnWatchMessage(file, watcher);
                    break;
                default:
                    throw new UnknownMessageTypeError(type);
            }
        } catch (e) {
            watcher.notifyAboutError(e);
        }
    }

    private async handleWatchMessage(file: string, watcher: Watcher, fromStart: boolean = false): Promise<void> {
        if (!await this.allowedLogFiles.contains(file)) {
            throw new LogFileAccessError(file);
        }
        const logFile: LogFile = await this.logFilePool.getLog(file);
        if (fromStart) {
            await watcher.watchFromTheBeginning(logFile);
        } else {
            await watcher.watchLog(logFile);
        }
    }

    private async handleUnWatchMessage(file: string, watcher: Watcher): Promise<void> {
        const logFile: LogFile = await this.logFilePool.getLog(file);
        await watcher.stopWatchingLog(logFile);
        await this.logFilePool.disposeIfNecessary(logFile);
    }

    private async handleConnectionClosure(watcher: Watcher): Promise<void> {
        const freedLogFiles: Array<LogFile> = await watcher.stopWatchingLogs();
        await this.logFilePool.disposeAllIfNecessary(freedLogFiles);
    }
}

/**
 * All possible values for a "type" message attribute.
 */
class MessageTypes {
    public static readonly WATCH = 'watch';
    public static readonly UNWATCH = 'unwatch';
    public static readonly ALL = [MessageTypes.WATCH, MessageTypes.UNWATCH];
}

/**
 * A client has sent a message with a message type, that is not supported.
 */
export class UnknownMessageTypeError extends Error {
    /**
     * Construct an error.
     *
     * @param type unknown message type
     */
    constructor(type: string) {
        super(`Unknown message "type": ${type}. Can be one of the following: ${MessageTypes.ALL}'`);
        Object.setPrototypeOf(this, UnknownMessageTypeError.prototype);
    }
}

/**
 * A client has sent a message without a "file" attribute specified.
 */
export class FileNameMissingError extends Error {
    /**
     * Construct an error.
     */
    constructor() {
        super('"file" attribute is missing. It should contain an absolute path to the file you want to watch.');
    }
}