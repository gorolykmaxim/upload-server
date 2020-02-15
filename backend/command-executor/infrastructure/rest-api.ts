import {Api} from "../../api";
import {Express, Request, Response} from "express";
import {
    CommandDoesNotExistError,
    CommandExecutorBoundedContext,
    ExecutionDoesNotExistError
} from "../domain/command-executor-bounded-context";
import {body} from "express-validator";
import {constants} from "os";

export class RestApi extends Api {
    constructor(private app: Express, private commandExecutorBoundedContext: CommandExecutorBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        this.app.get(`${baseUrl}/command`, (req: Request, res: Response) => {
            res.json(this.commandExecutorBoundedContext.getAllExecutableCommands());
        });
        this.app.post(`${baseUrl}/command`, [body('name').isString().notEmpty(), body('command').isString().notEmpty()], this.handleValidationErrors(), (req: Request, res: Response) => {
            try {
                res.status(201).json(this.commandExecutorBoundedContext.createCommand(req.body.name, req.body.command));
            } catch (e) {
                res.status(409).send(e.message);
            }
        });
        this.app.delete(`${baseUrl}/command/:id`, (req: Request, res: Response) => {
            this.commandExecutorBoundedContext.removeCommand(req.params.id);
            res.end();
        });
        this.app.post(`${baseUrl}/command/:id/execution`, async (req: Request, res: Response) => {
            try {
                res.status(201).json(await this.commandExecutorBoundedContext.executeCommand(req.params.id));
            } catch (e) {
                res.status(404).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/command/:id/execution`, async (req: Request, res: Response) => {
            try {
                res.json(await this.commandExecutorBoundedContext.getExecutionsOfCommand(req.params.id));
            } catch (e) {
                res.status(e instanceof CommandDoesNotExistError ? 404 : 500).send(e.message);
            }
        });
        this.app.get(`${baseUrl}/command/:commandId/execution/:startTime`, async (req: Request, res: Response) => {
            try {
                res.json(await this.commandExecutorBoundedContext.getExecutionOfCommand(req.params.commandId, parseInt(req.params.startTime), req.query.noSplit == 'true'));
            } catch (e) {
                res.status(e instanceof CommandDoesNotExistError || e instanceof ExecutionDoesNotExistError ? 404: 500).send(e.message);
            }
        });
        this.app.post(`${baseUrl}/command/:commandId/execution/:startTime/terminate`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.sendSignalToTheExecution(req.params.commandId, parseInt(req.params.startTime), constants.signals.SIGINT);
                res.end();
            } catch (e) {
                res.status(404).send(e.message);
            }
        });
        this.app.post(`${baseUrl}/command/:commandId/execution/:startTime/halt`, async (req: Request, res: Response) => {
            try {
                await this.commandExecutorBoundedContext.sendSignalToTheExecution(req.params.commandId, parseInt(req.params.startTime), constants.signals.SIGKILL);
                res.end();
            } catch (e) {
                res.status(404).send(e.message);
            }
        });
    }
}
