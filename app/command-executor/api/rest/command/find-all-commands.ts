import {Request, Response} from "express";
import {Collection} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {Endpoint} from "../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../common/api/failable-endpoint";
import {ExecutableCommand} from "./executable-command";

/**
 * Find all commands, that can be executed.
 */
export class FindAllCommands implements Endpoint {
    /**
     * Create an endpoint.
     *
     * @param commands collection, where the request will look for available commands
     */
    static create(commands: Collection<Command>): Endpoint {
        const endpoint = new FindAllCommands(commands);
        return new FailableEndpoint(endpoint, 'find commands, that can be executed');
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