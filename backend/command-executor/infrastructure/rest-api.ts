import {Api} from "../../api";
import {Express, Request, Response} from "express";
import {CommandExecutorBoundedContext} from "../domain/command-executor-bounded-context";
import {body} from "express-validator";

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
    }
}
