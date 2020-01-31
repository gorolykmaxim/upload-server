import * as express from "express";
import {LogFileFactory} from "./log-watcher/log/log-file-factory";
import {CreateTail, UnixLogFileFactory} from "./log-watcher/log/unix-log-file-factory";
import {EOL} from "os";
import {LogFilePool} from "./log-watcher/log/log-file-pool";
import {RestrictedLogFilePool} from "./log-watcher/log/restricted-log-file-pool";
import {Collection} from "./common/collection/collection";
import {LogFile} from "./log-watcher/log/log-file";
import {LogFileCollection} from "./log-watcher/log/log-file-collection";
import {LegacyWebSocketAPI} from "./log-watcher/api/legacy-web-socket-api";
import {WatcherFactory} from "./log-watcher/watcher/watcher-factory";
import {MessageFactory} from "./log-watcher/watcher/message-factory";
import {LegacyMessageFactory} from "./log-watcher/watcher/legacy-message-factory";
import {DefaultMessageFactory} from "./log-watcher/watcher/default-message-factory";
import {DefaultWebSocketAPI} from "./log-watcher/api/default-web-socket-api";
import {URL} from "./common/url";
import * as expressWs from "express-ws";
import {CreateUUID} from "./common/uuid";
import {Database, open} from "sqlite";
import {AllowedLogsCollection} from "./log-watcher/log/allowed-logs-collection";
import {FindAllowedLogs} from "./log-watcher/api/rest/find-allowed-logs";
import {GetLogSize} from "./log-watcher/api/rest/get-log-size";
import {GetLogContent} from "./log-watcher/api/rest/get-log-content";
import {AllowLog} from "./log-watcher/api/rest/allow-log";
import {DisallowLog} from "./log-watcher/api/rest/disallow-log";
import {ApplicationServer} from "./common/api/application-server";
import bodyParser = require("body-parser");
import Bluebird = require("bluebird");
import uuid = require("uuid");

async function main(): Promise<void> {
    const db: Database = await open('../../upload-server.db');
    // TODO: remove force: 'last'
    await db.migrate({force: 'last', migrationsPath: '../../migrations'});

    const Tail = require('nodejs-tail');
    const fileSystem = Bluebird.promisifyAll(require('fs'));

    const createTail: CreateTail = absolutePathToFile => new Tail(absolutePathToFile, {usePolling: true});
    const logFileFactory: LogFileFactory = new UnixLogFileFactory(createTail, fileSystem, EOL);
    const allowedLogs: Collection<string> = new AllowedLogsCollection(db);
    const logFiles: Collection<LogFile> = new LogFileCollection();
    const logFilePool: LogFilePool = new RestrictedLogFilePool(allowedLogs, logFiles, logFileFactory);

    const application: any = express();
    const applicationServer: ApplicationServer = new ApplicationServer(application);
    expressWs(application);
    application.use(bodyParser.json());
    const createUUID: CreateUUID = () => uuid();

    const legacyMessageFactory: MessageFactory = new LegacyMessageFactory();
    const legacyWatcherFactory: WatcherFactory = new WatcherFactory(createUUID, legacyMessageFactory);
    applicationServer.webSocket(URL.createNew(''), new LegacyWebSocketAPI(logFilePool, legacyWatcherFactory));

    const baseAPIURL: URL = URL.createNew('api');
    const baseLogWatcherAPIURL: URL = baseAPIURL.append('log-watcher');

    const messageFactory: MessageFactory = new DefaultMessageFactory();
    const watcherFactory: WatcherFactory = new WatcherFactory(createUUID, messageFactory);
    applicationServer.webSocket(baseLogWatcherAPIURL.append('log'), new DefaultWebSocketAPI(logFilePool, watcherFactory));

    const logURL: URL = baseLogWatcherAPIURL.append('log');
    const logSizeURL: URL = logURL.append('size');
    const logContentURL: URL = logURL.append('content');
    applicationServer.get(logURL, FindAllowedLogs.create(allowedLogs));
    applicationServer.get(logSizeURL, GetLogSize.create(logFilePool));
    applicationServer.get(logContentURL, GetLogContent.create(logFilePool));
    applicationServer.post(logURL, AllowLog.create(allowedLogs, fileSystem));
    applicationServer.delete(logURL, DisallowLog.create(allowedLogs));

    application.listen(8080, () => {console.log('Listening on 8080...')});
}

main();