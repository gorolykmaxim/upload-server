import * as express from "express";
import {LogFileFactory} from "./log-watcher/log/log-file-factory";
import {CreateTail, UnixLogFileFactory} from "./log-watcher/log/unix-log-file-factory";
import {EOL} from "os";
import {LogFilePool} from "./log-watcher/log/log-file-pool";
import {RestrictedLogFilePool} from "./log-watcher/log/restricted-log-file-pool";
import {Collection} from "./common/collection/collection";
import {ValuesCollection} from "./common/collection/values-collection";
import {LogFile} from "./log-watcher/log/log-file";
import {LogFileCollection} from "./log-watcher/log/log-file-collection";
import {LegacyWebSocketAPI} from "./log-watcher/api/legacy-web-socket-api";
import {WatcherFactory} from "./log-watcher/watcher/watcher-factory";
import {MessageFactory} from "./log-watcher/watcher/message-factory";
import {LegacyMessageFactory} from "./log-watcher/watcher/legacy-message-factory";
import {DefaultMessageFactory} from "./log-watcher/watcher/default-message-factory";
import {DefaultWebSocketAPI} from "./log-watcher/api/default-web-socket-api";
import {URL} from "./common/url";
import {RestAPI} from "./log-watcher/api/rest-api";
import * as expressWs from "express-ws";
import {WebSocketAPI} from "./log-watcher/api/web-socket-api";
import {CreateUUID} from "./common/uuid";
import bodyParser = require("body-parser");
import Bluebird = require("bluebird");
import uuid = require("uuid");

async function main(): Promise<void> {
    const Tail = require('nodejs-tail');
    const fileSystem = Bluebird.promisifyAll(require('fs'));

    const createTail: CreateTail = absolutePathToFile => new Tail(absolutePathToFile, {usePolling: true});
    const logFileFactory: LogFileFactory = new UnixLogFileFactory(createTail, fileSystem, EOL);
    const allowedLogs: Collection<string> = new ValuesCollection();
    const logFiles: Collection<LogFile> = new LogFileCollection();
    const logFilePool: LogFilePool = new RestrictedLogFilePool(allowedLogs, logFiles, logFileFactory);

    const application: any = express();
    expressWs(application);
    application.use(bodyParser.json());
    const createUUID: CreateUUID = () => uuid();

    const legacyMessageFactory: MessageFactory = new LegacyMessageFactory();
    const legacyWatcherFactory: WatcherFactory = new WatcherFactory(createUUID, legacyMessageFactory);
    const legacyAPI: WebSocketAPI = new LegacyWebSocketAPI(logFilePool, legacyWatcherFactory);
    application.ws('/', legacyAPI.onConnectionOpen.bind(legacyAPI));

    const baseAPIURL: URL = URL.createNew('api');
    const baseLogWatcherAPIURL: URL = baseAPIURL.append('log-watcher');

    const messageFactory: MessageFactory = new DefaultMessageFactory();
    const watcherFactory: WatcherFactory = new WatcherFactory(createUUID, messageFactory);
    const defaultWebSocketAPI: WebSocketAPI = new DefaultWebSocketAPI(logFilePool, watcherFactory);
    application.ws(baseLogWatcherAPIURL.append('log').value, defaultWebSocketAPI.onConnectionOpen.bind(defaultWebSocketAPI));

    const restAPI: RestAPI = new RestAPI(baseLogWatcherAPIURL, application, allowedLogs, logFilePool, fileSystem);

    application.listen(8080, () => {console.log('Listening on 8080...')});
}

main();