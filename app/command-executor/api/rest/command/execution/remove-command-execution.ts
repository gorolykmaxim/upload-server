import {ArgumentsConsumer, EndpointWithArguments} from "../../../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {Endpoint} from "../../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";

/**
 * Remove specified command execution. If execution is currently active - it will be halt abruptly and then removed.
 */
export class RemoveCommandExecution implements ArgumentsConsumer, Endpoint {
    private args: Arguments;

    /**
     * Construct an endpoint.
     *
     * @param activeExecutions collection where all active executions are stored
     * @param completeExecutions collection where all complete executions are stored
     */
    static create(activeExecutions: Collection<CommandExecution>,
                  completeExecutions: Collection<CommandExecution>): Endpoint {
        const endpoint: RemoveCommandExecution = new RemoveCommandExecution(activeExecutions, completeExecutions);
        const endpointWithArguments: Endpoint = new EndpointWithArguments(endpoint, 'params', ['commandId', 'startTime']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'remove execution of a command');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableEndpoint;
    }

    private constructor(private activeExecutions: Collection<CommandExecution>,
                        private completeExecutions: Collection<CommandExecution>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const commandId: string = this.args.get('commandId');
        const startTime: number = parseInt(this.args.get('startTime'));
        const id: any = {commandId: commandId, startTime: startTime};
        let execution: CommandExecution;
        if (await this.activeExecutions.contains(id)) {
            execution = await this.activeExecutions.findById(id);
            execution.haltAbruptly();
            await this.activeExecutions.remove(execution);
        } else {
            execution = await this.completeExecutions.findById(id);
            await this.completeExecutions.remove(execution);
        }
        res.end();
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}