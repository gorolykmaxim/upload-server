import * as express from "express";
import {Express, Request, Response} from "express";
import {ConfigAllowedLogFilesRepository} from "./log-watcher/infrastructure/config-allowed-log-files-repository";
import {JsonDB} from "node-json-db";
import {LogWatcherBoundedContext} from "./log-watcher/domain/log-watcher-bounded-context";
import {Server} from "http";

export class Application {
    readonly app: Express;
    server: Server;
    private jsonDB: JsonDB;
    private allowedLogFilesRepository: ConfigAllowedLogFilesRepository;
    private logWatcherBoundedContext: LogWatcherBoundedContext;

    constructor(jsonDB?: JsonDB) {
        this.app = express();
        this.jsonDB = jsonDB ?? new JsonDB('./upload-server-db', true, true);
        this.allowedLogFilesRepository = new ConfigAllowedLogFilesRepository(this.jsonDB);
        this.logWatcherBoundedContext = new LogWatcherBoundedContext(this.allowedLogFilesRepository);
    }

    async main(): Promise<void> {
        await this.initializeLogWatcher('/api/log-watcher');
        this.server = this.app.listen(8080, () => console.log('Listening on port 8080...'));
    }

    private async initializeLogWatcher(baseUrl: string): Promise<void> {
        this.allowedLogFilesRepository.initialize();
        this.app.get(`${baseUrl}/log`, (req: Request, res: Response) => {
            res.json(this.logWatcherBoundedContext.getLogFilesAllowedToBeWatched());
        });
    }
}
