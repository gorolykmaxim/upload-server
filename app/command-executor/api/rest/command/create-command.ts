import {ArgumentsConsumer, RequestWithArguments} from "../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../common/arguments";
import {Request, Response} from "express";
import {CommandFactory} from "../../../command/command-factory";
import {Collection} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {APIRequest} from "../../../../common/api/request";
import {FailableRequest} from "../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";
import {ExecutableCommand} from "./executable-command";

/**
 * Create a new command.
 */
export class CreateCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param factory factory, that will be used to construct new commands
     * @param commands collection, where new commands will be stored
     */
    static create(factory: CommandFactory, commands: Collection<Command>): APIRequest {
        const request: ArgumentsConsumer = new CreateCommand(factory, commands);
        const requestWithArguments = new RequestWithArguments(request, 'body', ['name', 'script']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'create a command');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        return failableRequest;
    }

    private constructor(private factory: CommandFactory, private commands: Collection<Command>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const command: Command = this.factory.create(this.args.get('name'), this.args.get('script'));
        await this.commands.add(command);
        const executableCommand: ExecutableCommand = new ExecutableCommand(command);
        res.end(JSON.stringify(executableCommand));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}