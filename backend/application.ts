import * as express from "express";
import {Express} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {Server} from "http";
import * as fs from "fs";
import {FileSystem} from "./log-watcher/domain/file-system";
import {FileWatcher} from "./log-watcher/domain/file-watcher";
import {platform} from "os";
import {WindowsFileWatcher} from "./log-watcher/infrastructure/windows-file-watcher";
import {UnixFileWatcher} from "./log-watcher/infrastructure/unix-file-watcher";
import {RestApi as LogWatcherRestApi} from "./log-watcher/infrastructure/rest-api";
import {WebSocketApi as LogWatcherWebSocketApi} from "./log-watcher/infrastructure/web-socket-api";
import {LegacyWebSocketApi as LogWatcherLegacyWebSocketApi} from "./log-watcher/infrastructure/legacy-web-socket-api";
import {Api} from "./api";
import bodyParser = require("body-parser");
import expressWs = require("express-ws");
import {ConfigCommandRepository} from "./command-executor/infrastructure/config-command-repository";
import {CommandExecutorBoundedContext} from "./command-executor/domain/command-executor-bounded-context";
import {RestApi as CommandExecutorRestApi} from "./command-executor/infrastructure/rest-api";

export class Application {
    readonly app: any;
    server: Server;
    private jsonDB: JsonDB;
    private fileSystem: FileSystem;
    private fileWatcher: FileWatcher;
    private allowedLogFilesRepository: ConfigAllowedLogFilesRepository;
    private logWatcherBoundedContext: LogWatcherBoundedContext;
    private logWatcherApis: Array<Api>;
    private commandRepository: ConfigCommandRepository;
    private commandExecutorBoundedContext: CommandExecutorBoundedContext;
    private commandExecutorApis: Array<Api>;

    constructor(app?: Express, jsonDB?: JsonDB, fileSystem?: FileSystem, fileWatcher?: FileWatcher) {
        if (app) {
            this.app = app;
        } else {
            this.app = express();
            expressWs(this.app);
        }
        this.jsonDB = jsonDB ?? new JsonDB('./upload-server-db', true, true);
        this.fileSystem = fileSystem ?? fs.promises;
        this.fileWatcher = fileWatcher ?? (platform() === 'win32' ? new WindowsFileWatcher('tail.exe') : new UnixFileWatcher());
        this.allowedLogFilesRepository = new ConfigAllowedLogFilesRepository(this.jsonDB);
        this.logWatcherBoundedContext = new LogWatcherBoundedContext(this.allowedLogFilesRepository, this.fileSystem, this.fileWatcher);
        this.logWatcherApis = [
            new LogWatcherRestApi(this.app, this.logWatcherBoundedContext),
            new LogWatcherWebSocketApi(this.app, this.logWatcherBoundedContext),
            new LogWatcherLegacyWebSocketApi(this.app, this.logWatcherBoundedContext)
        ];
        this.commandRepository = new ConfigCommandRepository(this.jsonDB);
        this.commandExecutorBoundedContext = new CommandExecutorBoundedContext(this.commandRepository);
        this.commandExecutorApis = [
            new CommandExecutorRestApi(this.app, this.commandExecutorBoundedContext)
        ];
    }

    async main(): Promise<void> {
        this.app.use(bodyParser());
        this.allowedLogFilesRepository.initialize();
        this.logWatcherApis.forEach(api => api.initialize('/api/log-watcher'));
        this.commandRepository.initialize();
        this.commandExecutorApis.forEach(api => api.initialize('/api/command-executor'));
        this.server = this.app.listen(8080, () => console.log('Listening on port 8080...'));
    }
}
