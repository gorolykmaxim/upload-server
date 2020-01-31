import {ArgumentsConsumer, EndpointWithArguments} from "../../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../../common/arguments";
import {Request, Response} from "express";
import {Collection, EntityNotFoundError} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {Endpoint} from "../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";

/**
 * Removes a command by the specified ID.
 */
export class RemoveCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param commands collection of commands, from which the command will be removed
     */
    static create(commands: Collection<Command>): Endpoint {
        const endpoint: ArgumentsConsumer = new RemoveCommand(commands);
        const endpointWithArguments: Endpoint = new EndpointWithArguments(endpoint, 'params', ['commandId']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'remove a command');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableEndpoint;
    }

    private constructor(private commands: Collection<Command>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const command: Command = await this.commands.findById(this.args.get('commandId'));
        await this.commands.remove(command);
        res.end();
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}