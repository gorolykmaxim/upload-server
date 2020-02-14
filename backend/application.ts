import * as express from "express";
import {Express, Request, Response} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {Server} from "http";
import {body, query, Result, ValidationError, validationResult} from "express-validator";
import * as fs from "fs";
import {FileSystem} from "./log-watcher/domain/file-system";
import bodyParser = require("body-parser");

export class Application {
    readonly app: Express;
    server: Server;
    private jsonDB: JsonDB;
    private fileSystem: FileSystem;
    private allowedLogFilesRepository: ConfigAllowedLogFilesRepository;
    private logWatcherBoundedContext: LogWatcherBoundedContext;

    constructor(jsonDB?: JsonDB, fileSystem?: FileSystem) {
        this.app = express();
        this.jsonDB = jsonDB ?? new JsonDB('./upload-server-db', true, true);
        this.fileSystem = fileSystem ?? fs.promises;
        this.allowedLogFilesRepository = new ConfigAllowedLogFilesRepository(this.jsonDB);
        this.logWatcherBoundedContext = new LogWatcherBoundedContext(this.allowedLogFilesRepository, this.fileSystem);
    }

    async main(): Promise<void> {
        this.app.use(bodyParser());
        await this.initializeLogWatcher('/api/log-watcher');
        this.server = this.app.listen(8080, () => console.log('Listening on port 8080...'));
    }

    private async initializeLogWatcher(baseUrl: string): Promise<void> {
        this.allowedLogFilesRepository.initialize();
        this.app.get(`${baseUrl}/log`, (req: Request, res: Response) => {
            res.json(this.logWatcherBoundedContext.getLogFilesAllowedToBeWatched());
        });
        this.app.post(`${baseUrl}/log`, body('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            res.status(201).json(await this.logWatcherBoundedContext.allowLogFileToBeWatched(req.body.absolutePath)).end();
        });
        this.app.delete(`${baseUrl}/log`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), (req: Request, res: Response) => {
            this.logWatcherBoundedContext.disallowLogFileToBeWatched(req.query.absolutePath);
            res.end();
        })
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
