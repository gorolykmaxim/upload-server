import * as express from "express";
import {Express, Request, Response} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {Server} from "http";
import {body, query, Result, ValidationError, validationResult} from "express-validator";
import * as fs from "fs";
import {FileSystem} from "./log-watcher/domain/file-system";
import {LogFileAccessError} from "./log-watcher/domain/log-file-access-error";
import {FileWatcher} from "./log-watcher/domain/file-watcher";
import {platform} from "os";
import {WindowsFileWatcher} from "./log-watcher/infrastructure/windows-file-watcher";
import {UnixFileWatcher} from "./log-watcher/infrastructure/unix-file-watcher";
import {Subscription} from "rxjs";
import bodyParser = require("body-parser");
import expressWs = require("express-ws");
import WebSocket = require("ws");

const Schema = require('validate');

export class Application {
    readonly app: any;
    server: Server;
    private jsonDB: JsonDB;
    private fileSystem: FileSystem;
    private fileWatcher: FileWatcher;
    private allowedLogFilesRepository: ConfigAllowedLogFilesRepository;
    private logWatcherBoundedContext: LogWatcherBoundedContext;

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
    }

    async main(): Promise<void> {
        this.app.use(bodyParser());
        await this.initializeLogWatcher('/api/log-watcher');
        this.server = this.app.listen(8080, () => console.log('Listening on port 8080...'));
    }

    private async initializeLogWatcher(baseUrl: string): Promise<void> {
        this.allowedLogFilesRepository.initialize();
        await this.initializeLogWatcherRest(baseUrl);
        await this.initializeLogWatcherWebSocketDefault(baseUrl);
        await this.initializeLogWatcherWebSocketLegacy();
    }

    private async initializeLogWatcherRest(baseUrl: string): Promise<void> {
        this.app.get(`${baseUrl}/log`, (req: Request, res: Response) => {
            res.json(this.logWatcherBoundedContext.getLogFilesAllowedToBeWatched());
        });
        this.app.post(`${baseUrl}/log`, body('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            res.status(201).json(await this.logWatcherBoundedContext.allowLogFileToBeWatched(req.body.absolutePath)).end();
        });
        this.app.delete(`${baseUrl}/log`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), (req: Request, res: Response) => {
            this.logWatcherBoundedContext.disallowLogFileToBeWatched(req.query.absolutePath);
            res.end();
        });
        this.app.get(`${baseUrl}/log/size`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            try {
                res.json(await this.logWatcherBoundedContext.getLogFileSize(req.query.absolutePath)).end();
            } catch (e) {
                res.status(e instanceof LogFileAccessError ? 403 : 500).end(e.message);
            }
        });
        this.app.get(`${baseUrl}/log/content`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            try {
                res.json(await this.logWatcherBoundedContext.getLogFileContent(req.query.absolutePath, req.query.noSplit == 'true')).end();
            } catch (e) {
                res.status(e instanceof LogFileAccessError ? 403 : 500).end(e.message);
            }
        });
    }

    private async initializeLogWatcherWebSocketDefault(baseUrl: string): Promise<void> {
        const requestQuerySchema = new Schema({
            absolutePath: {
                type: String,
                required: true
            },
            fromStart: {
                type: String,
                required: false
            }
        });
        this.app.ws(`${baseUrl}/log`, (connection: WebSocket, req: Request) => {
            try {
                requestQuerySchema.assert(req.query);
                const subscription: Subscription = this.logWatcherBoundedContext.watchLogFileContent(req.query.absolutePath, false, req.query.fromStart == 'true').subscribe(
                    change => connection.send(JSON.stringify(change)),
                    error => connection.close(1008, error.message)
                );
                connection.on('close', () => subscription.unsubscribe());
            } catch (e) {
                connection.close(1008, e.message);
            }
        });
    }

    private async initializeLogWatcherWebSocketLegacy(): Promise<void> {
        const messageSchema = new Schema({
            type: {
                type: String,
                required: true,
                enum: ['watch', 'unwatch']
            },
            file: {
                type: String,
                required: true
            },
            fromStart: {
                type: Boolean,
                required: false
            }
        });
        this.app.ws('/', (connection: WebSocket, req: Request) => {
            const pathToSubscription: Map<string, Subscription> = new Map<string, Subscription>();
            connection.on('message', rawMessage => {
                try {
                    const message: any = JSON.parse(rawMessage.toString());
                    messageSchema.assert(message);
                    if (message.type === 'watch') {
                        const subscription: Subscription = this.logWatcherBoundedContext.watchLogFileContent(message.file, true, message.fromStart).subscribe(
                            changes => connection.send(JSON.stringify(Object.assign({type: 'change'}, changes))),
                            error => {
                                connection.send(JSON.stringify({type: 'error', message: error.message}));
                                pathToSubscription.delete(message.file);
                            }
                        );
                        pathToSubscription.set(message.file, subscription);
                    } else {
                        const subscription: Subscription = pathToSubscription.get(message.file);
                        if (subscription) {
                            subscription.unsubscribe();
                            pathToSubscription.delete(message.file);
                        }
                    }
                } catch (e) {
                    connection.send(JSON.stringify({type: 'error', message: e.message}));
                }
            });
            connection.on('close', () => {
                pathToSubscription.forEach(s => s.unsubscribe());
                pathToSubscription.clear();
            });
        });
    }

    private handleValidationErrors(): (req: Request, res: Response, next: Function) => void {
        return (req, res, next) => {
            const errors: Result<ValidationError>  = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({errors: errors.array()});
            } else {
                next();
            }
        }
    }
}
