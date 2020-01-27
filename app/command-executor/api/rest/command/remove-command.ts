import {ArgumentsConsumer, RequestWithArguments} from "../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../common/arguments";
import {Request, Response} from "express";
import {Collection, EntityNotFoundError} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {APIRequest} from "../../../../common/api/request";
import {FailableRequest} from "../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";

/**
 * Removes a command by the specified ID.
 */
export class RemoveCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param commands collection of commands, from which the command will be removed
     */
    static create(commands: Collection<Command>): APIRequest {
        const request: ArgumentsConsumer = new RemoveCommand(commands);
        const requestWithArguments: APIRequest = new RequestWithArguments(request, 'params', ['commandId']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'remove a command');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        failableRequest.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableRequest;
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