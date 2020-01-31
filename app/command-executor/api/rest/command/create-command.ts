import {ArgumentsConsumer, EndpointWithArguments} from "../../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../../common/arguments";
import {Request, Response} from "express";
import {CommandFactory} from "../../../command/command-factory";
import {Collection} from "../../../../common/collection/collection";
import {Command} from "../../../command/command";
import {Endpoint} from "../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";
import {ExecutableCommand} from "./executable-command";

/**
 * Create a new command.
 */
export class CreateCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param factory factory, that will be used to construct new commands
     * @param commands collection, where new commands will be stored
     */
    static create(factory: CommandFactory, commands: Collection<Command>): Endpoint {
        const endpoint: ArgumentsConsumer = new CreateCommand(factory, commands);
        const endpointWithArguments = new EndpointWithArguments(endpoint, 'body', ['name', 'script']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'create a command');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        return failableEndpoint;
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