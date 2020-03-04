import {Api} from "../../api";
import {Express, Request, Response} from "express";
import {
    CommandDoesNotExistError,
    CommandExecutorBoundedContext,
    ExecutionDoesNotExistError
} from "../domain/command-executor-bounded-context";
import {body} from "express-validator";
import {constants} from "os";
import bodyParser = require("body-parser");

export class RestApi extends Api {
    constructor(private app: Express, private commandExecutorBoundedContext: CommandExecutorBoundedContext,
                private isReadonly: boolean) {
        super();
    }

    initialize(baseUrl: string): void {
        this.app.use(`${baseUrl}/*`, bodyParser.json());
        this.app.get(`${baseUrl}/command`, (req: Request, res: Response) => {
            res.json(this.commandExecutorBoundedContext.getAllExecutableCommands());
        });
        if (!this.isReadonly) {
            this.app.post(`${baseUrl}/command`, [body('name').isString().notEmpty(), body('script').isString().notEmpty()], this.handleValidationErrors(), (req: Request, res: Response) => {
                try {
                    res.status(201).json(this.commandExecutorBoundedContext.createCommand(req.body.name, req.body.script));
                } catch (e) {
                    console.error(e.message, this);
                    res.status(409).send(e.message);
                }
            });
            this.app.delete(`${baseUrl}/command/:id`, async (req: Request, res: Response) => {
                try {
                    await this.commandExecutorBoundedContext.removeCommand(req.params.id);
                    res.end();
                } catch (e) {
                    console.error(e.message, this);
                    res.status(500).send(e.message);
                }
            });
        }
        this.app.post(`${baseUrl}/command/:id/execution`, async (req: Request, res: Response) => {
            try {
                res.status(201).json(await this.commandExecutorBoundedContext.executeCommand(req.params.id));
            } catch (e) {
                console.error(e.message, this);
                res.status(404).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/execution`, async (req: Request, res: Response) => {
            try {
                res.json(await this.commandExecutorBoundedContext.getAllExecutions());
            } catch (e) {
                console.error(e.message, this);
                res.status(500).send(e.message);
            }
        });
        this.app.delete(`${baseUrl}/execution`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.removeAllExecutions();
                res.end();
            } catch (e) {
                console.error(e.message, this);
                res.status(500).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/command/:id/execution`, async (req: Request, res: Response) => {
            try {
                res.json(await this.commandExecutorBoundedContext.getExecutionsOfCommand(req.params.id));
            } catch (e) {
                console.error(e.message, this);
                res.status(e instanceof CommandDoesNotExistError ? 404 : 500).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/command/:commandId/execution/:startTime`, async (req: Request, res: Response) => {
            try {
                res.json(await this.commandExecutorBoundedContext.getExecutionOfCommand(req.params.commandId, parseInt(req.params.startTime), req.query.noSplit == 'true'));
            } catch (e) {
                console.error(e.message, this);
                res.status(e instanceof CommandDoesNotExistError || e instanceof ExecutionDoesNotExistError ? 404 : 500).send(e.message);
            }
        });
        this.app.delete(`${baseUrl}/command/:commandId/execution/:startTime`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.removeExecution(req.params.commandId, parseInt(req.params.startTime));
                res.end();
            } catch (e) {
                console.error(e.message, this);
                res.status(e instanceof CommandDoesNotExistError || e instanceof ExecutionDoesNotExistError ? 404 : 500).send(e.message);
            }
        });
        this.app.post(`${baseUrl}/command/:commandId/execution/:startTime/terminate`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.sendSignalToTheExecution(req.params.commandId, parseInt(req.params.startTime), constants.signals.SIGINT);
                res.end();
            } catch (e) {
                console.error(e.message, this);
                res.status(404).send(e.message);
            }
        });
        this.app.post(`${baseUrl}/command/:commandId/execution/:startTime/halt`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.sendSignalToTheExecution(req.params.commandId, parseInt(req.params.startTime), constants.signals.SIGKILL);
                res.end();
            } catch (e) {
                console.error(e.message, this);
                res.status(404).send(e.message);
            }
        });
    }
}
