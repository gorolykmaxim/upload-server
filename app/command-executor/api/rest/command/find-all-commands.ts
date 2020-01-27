import {Request, Response} from "express";
import {Collection} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {APIRequest} from "../../../../common/api/request";
import {FailableRequest} from "../../../../common/api/failable-request";
import {ExecutableCommand} from "./executable-command";

/**
 * Find all commands, that can be executed.
 */
export class FindAllCommands implements APIRequest {
    /**
     * Create a request.
     *
     * @param commands collection, where the request will look for available commands
     */
    static create(commands: Collection<Command>): APIRequest {
        const request = new FindAllCommands(commands);
        return new FailableRequest(request, 'find commands, that can be executed');
    }

    private constructor(private commands: Collection<Command>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const foundCommands: Array<Command> = await this.commands.findAll();
        const executableCommands: Array<ExecutableCommand> = foundCommands.map(c => new ExecutableCommand(c));
        res.end(JSON.stringify(executableCommands));
    }
}