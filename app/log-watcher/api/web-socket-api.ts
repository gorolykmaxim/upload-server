import {LogFilePool} from "../log/log-file-pool";
import {WatcherFactory} from "../watcher/watcher-factory";
import {Server} from "ws";
import WebSocket = require("ws");
import {Watcher} from "../watcher/watcher";
import {LogFile} from "../log/log-file";
import {URL} from "../../url";
import {ArgumentError} from "common-errors";
import {webSocketToString} from "./web-socket";

/**
 * Current web-socket API of upload-server, used to obtain information about changes in log files in a real time.
 */
export class WebSocketAPI {
    /**
     * Construct an API.
     *
     * @param logFilePool pool of log files, where the API will look for logs to watches changes in
     * @param watcherFactory factory, that will be used by the API to create watchers for all new client connections
     * @param server server to listen to incoming connections on
     */
    constructor(private logFilePool: LogFilePool, private watcherFactory: WatcherFactory, server: Server) {
        server.on('connection', this.handleConnectionOpening.bind(this));
    }

    private async handleConnectionOpening(connection: WebSocket): Promise<void> {
        let watcher: Watcher;
        let logFile: LogFile;
        try {
            console.info("%s got a new connection %s. Going to start watching a log file immediately.", this, webSocketToString(connection));
            watcher = this.watcherFactory.create(connection);
            connection.on('close', () => this.handleConnectionClosure(watcher));
            const url: URL = new URL(connection.url);
            const absoluteLogFilePath: string = url.getQueryValueOf('absolutePath');
            if (!absoluteLogFilePath) {
                throw new ArgumentError('absolutePath');
            }
            const fromStart = url.getQueryValueOf('fromStart') || false;
            logFile = await this.logFilePool.getLog(absoluteLogFilePath);
            if (fromStart) {
                await watcher.watchFromTheBeginning(logFile);
            } else {
                await watcher.watchLog(logFile);
            }
        } catch (e) {
            watcher?.notifyAboutError(e);
        }
    }

    private async handleConnectionClosure(watcher: Watcher): Promise<void> {
        console.info("%s has disconnected from %s. Going to dispose all of it's logs if nobody else watches them", watcher, this);
        const freedLogFiles: Array<LogFile> = await watcher.stopWatchingLogs();
        await this.logFilePool.disposeAllIfNecessary(freedLogFiles);
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return "WebSocketAPI{}";
    }
}