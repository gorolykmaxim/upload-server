import {Api} from "../../api";
import {Express, Request, Response} from "express";
import {CommandExecutorBoundedContext} from "../domain/command-executor-bounded-context";

export class RestApi extends Api {
    constructor(private app: Express, private commandExecutorBoundedContext: CommandExecutorBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        this.app.get(`${baseUrl}/command`, (req: Request, res: Response) => {
            res.json(this.commandExecutorBoundedContext.getAllExecutableCommands());
        });
    }
}
