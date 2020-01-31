import {ArgumentsConsumer, EndpointWithArguments} from "../../../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {Endpoint} from "../../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";
import {CommandExecutionModel} from "./command-execution-model";

/**
 * Find all executions of the specified command.
 */
export class FindExecutionsOfCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param activeExecutions collection, where all currently active executions reside
     * @param completeExecutions collection, where all complete executions are stored
     */
    static create(activeExecutions: Collection<CommandExecution>, completeExecutions: Collection<CommandExecution>): Endpoint {
        const endpoint: ArgumentsConsumer = new FindExecutionsOfCommand(activeExecutions, completeExecutions);
        const endpointWithArguments: Endpoint = new EndpointWithArguments(endpoint, 'params', ['commandId']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'find executions of a command');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableEndpoint;
    }

    private constructor(private activeExecutions: Collection<CommandExecution>, private completeExecutions: Collection<CommandExecution>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const commandId: string = this.args.get('commandId');
        const allExecutions: Array<CommandExecution> = [];
        for (let collection of [this.activeExecutions, this.completeExecutions]) {
            let executions: Array<CommandExecution> = await collection.findAll();
            allExecutions.push(...executions.filter(ce => ce.commandId === commandId));
        }
        allExecutions.sort(CommandExecution.compare);
        const response: Array<CommandExecutionModel> = allExecutions.map(ce => new CommandExecutionModel(ce));
        res.end(JSON.stringify(response));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}