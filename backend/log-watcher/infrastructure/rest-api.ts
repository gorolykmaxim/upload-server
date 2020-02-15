import {Api} from "../../api";
import {Express, Request, Response} from "express";
import {body, query} from "express-validator";
import {LogFileAccessError} from "../domain/log-file-access-error";
import {LogWatcherBoundedContext} from "../domain/log-watcher-bounded-context";

export class RestApi extends Api {
    constructor(private app: Express, private logWatcherBoundedContext: LogWatcherBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        this.app.get(`${baseUrl}/log`, (req: Request, res: Response) => {
            res.json(this.logWatcherBoundedContext.getLogFilesAllowedToBeWatched());
        });
        this.app.post(`${baseUrl}/log`, body('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            res.status(201).json(await this.logWatcherBoundedContext.allowLogFileToBeWatched(req.body.absolutePath));
        });
        this.app.delete(`${baseUrl}/log`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), (req: Request, res: Response) => {
            this.logWatcherBoundedContext.disallowLogFileToBeWatched(req.query.absolutePath);
            res.end();
        });
        this.app.get(`${baseUrl}/log/size`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            try {
                res.json(await this.logWatcherBoundedContext.getLogFileSize(req.query.absolutePath));
            } catch (e) {
                res.status(e instanceof LogFileAccessError ? 403 : 500).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/log/content`, query('absolutePath').isString().notEmpty(), this.handleValidationErrors(), async (req: Request, res: Response) => {
            try {
                res.json(await this.logWatcherBoundedContext.getLogFileContent(req.query.absolutePath, req.query.noSplit == 'true'));
            } catch (e) {
                res.status(e instanceof LogFileAccessError ? 403 : 500).send(e.message);
            }
        });
    }
}
