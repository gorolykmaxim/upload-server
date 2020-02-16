import * as express from "express";
import {Express} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {Server} from "http";
import * as fs from "fs";
import {FileSystem as LogWatcherFileSystem} from "./log-watcher/domain/file-system";
import {FileWatcher} from "./log-watcher/domain/file-watcher";
import {platform} from "os";
import {WindowsFileWatcher} from "./log-watcher/infrastructure/windows-file-watcher";
import {UnixFileWatcher} from "./log-watcher/infrastructure/unix-file-watcher";
import {RestApi as LogWatcherRestApi} from "./log-watcher/infrastructure/rest-api";
import {WebSocketApi as LogWatcherWebSocketApi} from "./log-watcher/infrastructure/web-socket-api";
import {LegacyWebSocketApi as LogWatcherLegacyWebSocketApi} from "./log-watcher/infrastructure/legacy-web-socket-api";
import {Api} from "./api";
import {ConfigCommandRepository} from "./command-executor/infrastructure/config-command-repository";
import {CommandExecutorBoundedContext} from "./command-executor/domain/command-executor-bounded-context";
import {RestApi as CommandExecutorRestApi} from "./command-executor/infrastructure/rest-api";
import {WebSocketApi as CommandExecutorWebSocketApi} from "./command-executor/infrastructure/web-socket-api";
import {ProcessFactory} from "./command-executor/domain/process";
import systemClock, {Clock} from "clock";
import {OsProcessFactory} from "./command-executor/infrastructure/os-process";
import {Database, open} from "sqlite";
import {ExecutionRepository} from "./command-executor/domain/execution";
import {InMemoryExecutionRepository} from "./command-executor/infrastructure/in-memory-execution-repository";
import {DatabaseExecutionRepository} from "./command-executor/infrastructure/database-execution-repository";
import {join} from "path";
import {FileSystem as UploaderFileSystem} from "./uploader/domain/file-system";
import {UploaderBoundedContext} from "./uploader/domain/uploader-bounded-context";
import {RestApi as UploaderRestApi} from "./uploader/infrastructure/rest-api";
import {OsFileSystem} from "./uploader/infrastructure/os-file-system";
import bodyParser = require("body-parser");
import expressWs = require("express-ws");

export class Application {
    readonly app: any;
    server: Server;
    private jsonDB: JsonDB;
    private logWatcherFileSystem: LogWatcherFileSystem;
    private uploaderFileSystem: UploaderFileSystem;
    private fileWatcher: FileWatcher;
    private clock: Clock;
    private processFactory: ProcessFactory;
    private database: Database;

    constructor(app?: Express, jsonDB?: JsonDB, logWatcherFileSystem?: LogWatcherFileSystem, fileWatcher?: FileWatcher,
                clock?: Clock, processFactory?: ProcessFactory, database?: Database,
                uploaderFileSystem?: UploaderFileSystem) {
        if (app) {
            this.app = app;
        } else {
            this.app = express();
            expressWs(this.app);
        }
        this.jsonDB = jsonDB ?? new JsonDB('./upload-server-db', true, true);
        this.logWatcherFileSystem = logWatcherFileSystem ?? fs.promises;
        this.uploaderFileSystem = uploaderFileSystem ?? new OsFileSystem();
        this.fileWatcher = fileWatcher ?? (platform() === 'win32' ? new WindowsFileWatcher('tail.exe') : new UnixFileWatcher());
        this.clock = clock ?? systemClock;
        this.processFactory = processFactory ?? new OsProcessFactory();
        this.database = database;
    }

    async main(): Promise<void> {
        this.app.use(bodyParser());
        // log-watcher
        const allowedLogFilesRepository: ConfigAllowedLogFilesRepository = new ConfigAllowedLogFilesRepository(this.jsonDB);
        const logWatcherBoundedContext: LogWatcherBoundedContext = new LogWatcherBoundedContext(allowedLogFilesRepository, this.logWatcherFileSystem, this.fileWatcher);
        const logWatcherApis: Array<Api> = [
            new LogWatcherRestApi(this.app, logWatcherBoundedContext),
            new LogWatcherWebSocketApi(this.app, logWatcherBoundedContext),
            new LogWatcherLegacyWebSocketApi(this.app, logWatcherBoundedContext)
        ];
        allowedLogFilesRepository.initialize();
        logWatcherApis.forEach(api => api.initialize('/api/log-watcher'));
        // command-executor
        if (!this.database) {
            const rootDirectory: string = join(__dirname, '../..');
            this.database = await open(join(rootDirectory, 'upload-server.db'));
            // TODO: remove force last
            await this.database.migrate({force: 'last', migrationsPath: join(rootDirectory, 'migrations')});
        }
        const commandRepository: ConfigCommandRepository = new ConfigCommandRepository(this.jsonDB);
        const activeExecutionRepository: ExecutionRepository = new InMemoryExecutionRepository();
        const completeExecutionRepository: ExecutionRepository = new DatabaseExecutionRepository(this.database);
        const commandExecutorBoundedContext: CommandExecutorBoundedContext = new CommandExecutorBoundedContext(
            commandRepository, this.clock, this.processFactory, activeExecutionRepository, completeExecutionRepository);
        const commandExecutorApis: Array<Api> = [
            new CommandExecutorRestApi(this.app, commandExecutorBoundedContext),
            new CommandExecutorWebSocketApi(this.app, commandExecutorBoundedContext)
        ];
        commandRepository.initialize();
        commandExecutorApis.forEach(api => api.initialize('/api/command-executor'));
        // uploader
        const uploadDirectory: string = join(__dirname, '../../files');
        const uploaderBoundedContext: UploaderBoundedContext = new UploaderBoundedContext(uploadDirectory, this.uploaderFileSystem);
        const uploaderApi = new UploaderRestApi(uploadDirectory, this.app, uploaderBoundedContext);
        uploaderApi.initialize('/api/uploader');
        this.server = this.app.listen(8080, () => console.log('Listening on port 8080...'));
    }
}
