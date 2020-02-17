import * as express from "express";
import {Express, Request, Response} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {createServer as createHttpServer, Server} from "http";
import * as fs from "fs";
import {readFileSync} from "fs";
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
import * as path from "path";
import {join} from "path";
import {FileSystem as UploaderFileSystem} from "./uploader/domain/file-system";
import {UploaderBoundedContext} from "./uploader/domain/uploader-bounded-context";
import {RestApi as UploaderRestApi} from "./uploader/infrastructure/rest-api";
import {OsFileSystem} from "./uploader/infrastructure/os-file-system";
import {ConfigCredentialsRepository} from "./authentication/infrastructure/config-credentials-repository";
import {AuthenticationBoundedContext} from "./authentication/domain/authentication-bounded-context";
import * as expressBasicAuth from "express-basic-auth";
import * as minimist from "minimist";
import {createLogger, format, Logger, transports} from "winston";
import {createServer as createHttpsServer} from "https";
import bodyParser = require("body-parser");
import expressWs = require("express-ws");

/**
 * Root class of the upload-server that is responsible for bootstrapping the thing.
 */
export class Application {
    readonly app: any;
    server: Server;
    /**
     * This is set to "true" in every test, so that some aspects of functionality do not interfere with tests.
     */
    debug: boolean = false;
    /**
     * A package.json information that will be taken from the actual file. In debug mode it will remain like this.
     */
    private pkg: any = {version: 8};
    private args: CommandLineArguments;
    private jsonDB: JsonDB;
    private logWatcherFileSystem: LogWatcherFileSystem;
    private uploaderFileSystem: UploaderFileSystem;
    private fileWatcher: FileWatcher;
    private clock: Clock;
    private processFactory: ProcessFactory;
    private database: Database;
    private uploadDirectory: string;
    private authenticationBoundedContext: AuthenticationBoundedContext;

    /**
     * Construct an application. All arguments of this constructor are only intended to be used in tests to inject
     * mocks of dependencies. Those dependencies that are either not injected or injected with "null" will get
     * initialized like in a normal (not a test) run.
     */
    constructor(app?: Express, jsonDB?: JsonDB, logWatcherFileSystem?: LogWatcherFileSystem, fileWatcher?: FileWatcher,
                clock?: Clock, processFactory?: ProcessFactory, database?: Database,
                uploaderFileSystem?: UploaderFileSystem, uploadDirectory?: string) {
        this.args = new CommandLineArguments(minimist(process.argv.slice(2)));
        if (app) {
            this.app = app;
        } else {
            this.app = express();
            expressWs(this.app);
        }
        this.jsonDB = jsonDB ?? new JsonDB(this.args.configFile, true, true);
        this.logWatcherFileSystem = logWatcherFileSystem ?? fs.promises;
        this.uploaderFileSystem = uploaderFileSystem ?? new OsFileSystem();
        this.fileWatcher = fileWatcher ?? (platform() === 'win32' ? new WindowsFileWatcher(path.join('..', '..', 'tail.exe')) : new UnixFileWatcher());
        this.clock = clock ?? systemClock;
        this.processFactory = processFactory ?? new OsProcessFactory();
        this.database = database;
        this.uploadDirectory = uploadDirectory ?? this.args.folder;
    }

    async main(): Promise<void> {
        // First, handle cases when we need to exist right away.
        this.loadPackageInformationIfNecessary();
        if (this.args.version) {
            console.info(this.pkg.version);
            return;
        }
        if (this.args.help) {
            this.displayHelp();
            return;
        }
        // Second, initialize all the core modules.
        this.initializeLogger();
        console.log(`Is in debug mode - ${this.debug}`, this);
        console.log(`Is in admin mode - ${this.args.isInAdminMode}`, this);
        this.app.use(bodyParser.json());
        this.initializeAuthenticationIfNecessary();
        await this.initializeLogWatcher();
        await this.initializeCommandExecutor();
        await this.initializeUploader();
        this.initializeFrontEnd();
        // Finally finish the initialization.
        this.placeUncaughtErrorTrapIfNecessary();
        this.initializeServer();
        this.authenticationBoundedContext?.displayCredentialsInLog();
    }

    private loadPackageInformationIfNecessary(): void {
        if (!this.debug) {
            this.pkg = require('../../package.json');
        }
    }

    private displayHelp(): void {
        console.info([
            '', `File upload server v${this.pkg.version}`,
            '', 'usage: upload-server [options]',
            '',
            'options:',
            '  -p --port      Port number (default: 8090)',
            '  -f --folder    Folder to upload files (default: files)',
            '  -l --log       Path to the file, were logs should be written',
            '  -d --database  Path to the file, were the database should be stored',
            '  -S --tls       Enable TLS / HTTPS',
            '  -C --cert      Server certificate file',
            '  -K --key       Private key file',
            '  -h --help      Print this list and exit',
            '  -a --admin     Enable configuration via web UI',
            '  --insecure     Disable authorization of /files/ and /api/uploader endpoints',
            '  -v --version   Print the current version',
            ''
        ].join('\n'));
    }

    private initializeLogger() {
        const transportList: Array<any> = [new transports.Console()];
        if (!this.debug) {
            transportList.push(new transports.File({filename: this.args.logFile, maxsize: 5000000, maxFiles: 1}));
        }
        const logger: Logger = createLogger({
            format: format.combine(
                format.timestamp(),
                format.printf((message) => `${message.timestamp} ${message.level.toUpperCase()} ${message.message}`)
            ),
            transports: transportList
        });
        console.log = (message: string, author?: any) => logger.info(author ? `${author.constructor.name} ${message}` : message);
        console.error = (message: string, author?: any) => logger.error(author ? `${author.constructor.name} ${message}` : message);
        console.info = (message: string, author?: any) => logger.info(author ? `${author.constructor.name} ${message}` : message);
        console.log('Logger initialization complete', this);
    }

    private initializeAuthenticationIfNecessary(): void {
        console.log(`Will initialize authentication - ${this.args.isAuthorizationEnabled}`, this);
        if (this.args.isAuthorizationEnabled) {
            const credentialsRepository: ConfigCredentialsRepository = new ConfigCredentialsRepository(this.jsonDB);
            credentialsRepository.initialize();
            this.authenticationBoundedContext = new AuthenticationBoundedContext(credentialsRepository);
            for (let url of ['/files/*', '/api/uploader/*']) {
                console.log(`Making access to ${url} authenticated`, this);
                this.app.use(url, expressBasicAuth({authorizer: (username: string, password: string) => this.authenticationBoundedContext.areCredentialsValid(username, password)}));
            }
        }
    }

    private async initializeLogWatcher(): Promise<void> {
        // log-watcher
        console.log('Initializing log watcher', this);
        const allowedLogFilesRepository: ConfigAllowedLogFilesRepository = new ConfigAllowedLogFilesRepository(this.jsonDB);
        const logWatcherBoundedContext: LogWatcherBoundedContext = new LogWatcherBoundedContext(allowedLogFilesRepository, this.logWatcherFileSystem, this.fileWatcher);
        const logWatcherApis: Array<Api> = [
            new LogWatcherRestApi(this.app, logWatcherBoundedContext, !this.args.isInAdminMode && !this.debug),
            new LogWatcherWebSocketApi(this.app, logWatcherBoundedContext),
            new LogWatcherLegacyWebSocketApi(this.app, logWatcherBoundedContext)
        ];
        allowedLogFilesRepository.initialize();
        logWatcherApis.forEach(api => api.initialize('/api/log-watcher'));
        // application log
        if (!this.debug) {
            await logWatcherBoundedContext.allowLogFileToBeWatched(this.args.logFile);
        }
    }

    private async initializeCommandExecutor(): Promise<void> {
        console.log('Initializing command executor', this);
        if (!this.database) {
            // the database will reside near the configuration
            const rootDirectory: string = path.dirname(this.args.configFile);
            console.log(`Creating database file in the directory '${rootDirectory}'`, this);
            this.database = await open(join(rootDirectory, 'upload-server.db'));
            await this.database.migrate({migrationsPath: join(__dirname, '..', '..', 'migrations')});
        }
        const commandRepository: ConfigCommandRepository = new ConfigCommandRepository(this.jsonDB);
        const activeExecutionRepository: ExecutionRepository = new InMemoryExecutionRepository();
        const completeExecutionRepository: ExecutionRepository = new DatabaseExecutionRepository(this.database);
        const commandExecutorBoundedContext: CommandExecutorBoundedContext = new CommandExecutorBoundedContext(
            commandRepository, this.clock, this.processFactory, activeExecutionRepository, completeExecutionRepository);
        const commandExecutorApis: Array<Api> = [
            new CommandExecutorRestApi(this.app, commandExecutorBoundedContext, !this.args.isInAdminMode && !this.debug),
            new CommandExecutorWebSocketApi(this.app, commandExecutorBoundedContext)
        ];
        commandRepository.initialize();
        commandExecutorApis.forEach(api => api.initialize('/api/command-executor'));
    }

    private async initializeUploader(): Promise<void> {
        console.log('Initializing uploader', this);
        const uploaderBoundedContext: UploaderBoundedContext = new UploaderBoundedContext(this.uploadDirectory, this.uploaderFileSystem);
        if (!this.debug) {
            console.log(`Will make sure the upload directory exists - '${this.uploadDirectory}'`, this);
            await uploaderBoundedContext.initialize();
        }
        const uploaderApi = new UploaderRestApi(this.uploadDirectory, this.app, uploaderBoundedContext);
        uploaderApi.initialize('/api/uploader');
    }

    private placeUncaughtErrorTrapIfNecessary(): void {
        if (!this.debug) {
            console.log('Going to catch all uncaught errors and log them', this);
            process.on('uncaughtException', err => console.error(err));
        }
    }

    private initializeFrontEnd(): void {
        const frontEndDirectory: string = join(__dirname, '..', '..', 'frontend', 'dist', 'frontend');
        console.log(`Will serve frontend assets, located in '${frontEndDirectory}'`, this);
        this.app.get('*.*', express.static(frontEndDirectory, {maxAge: '1y'}));
        this.app.all('*', (req: Request, res: Response) => {
            res.status(200).sendFile('/', {root: frontEndDirectory});
        });
    }

    private initializeServer(): void {
        console.log('Will initialize an HTTP server', this);
        let startLogMessage: string;
        if (this.args.isTlsEnabled && this.args.certificateFile && this.args.keyFile) {
            const options: any = {
                key: readFileSync(this.args.keyFile),
                cert: readFileSync(this.args.certificateFile)
            };
            startLogMessage = `Server started on https://0.0.0.0:${this.args.port}`;
            this.server = createHttpsServer(options, this.app);
        } else {
            startLogMessage = `Server started on http://0.0.0.0:${this.args.port}`;
            this.server = createHttpServer(this.app);
        }
        console.info(`File upload server v${this.pkg.version}`, this);
        console.info(`Serving files from folder: ${this.args.folder}`, this);
        this.server.listen(this.args.port, '0.0.0.0', () => console.log(startLogMessage, this));
    }
}

class CommandLineArguments {
    port: number = 8090;
    folder: string = 'files';
    version: boolean;
    isTlsEnabled: boolean;
    certificateFile: string;
    keyFile: string;
    isInAdminMode: boolean;
    isAuthorizationEnabled: boolean;
    logFile: string = 'upload-server.log';
    configFile: string = 'upload-server-db';
    help: boolean;

    constructor(argv: any) {
        this.port = argv.p || argv.port || this.port;
        this.folder = path.resolve(argv.f || argv.folder || this.folder);
        this.version = argv.v || argv.version;
        this.isTlsEnabled = argv.S || argv.tls;
        this.certificateFile = argv.C || argv.cert;
        this.keyFile = argv.K || argv.key;
        this.isInAdminMode = argv.a || argv.admin;
        this.isAuthorizationEnabled = !argv.insecure;
        this.logFile = argv.l || argv.log || this.logFile;
        this.configFile = argv.d || argv.database || this.configFile;
        this.help = argv.h || argv.help;
    }
}
