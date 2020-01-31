import {ArgumentsConsumer, EndpointWithArguments} from "../../../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {Endpoint} from "../../../../../common/api/endpoint";
import {FailableEndpoint} from "../../../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";

/**
 * Terminate or halt the specified command execution.
 */
export class TerminateCommandExecution implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Construct an endpoint, that will terminate execution of the command.
     *
     * @param activeExecutions collection, that contains all active executions, that can be terminated
     */
    static createTerminate(activeExecutions: Collection<CommandExecution>): Endpoint {
        return this.create(activeExecutions, false);
    }

    /**
     * Construct an endpoint, that will halt execution of the command.
     *
     * @param activeExecutions collection, that contains all active executions, that can be halt
     */
    static createHalt(activeExecutions: Collection<CommandExecution>): Endpoint {
        return this.create(activeExecutions, true);
    }

    private static create(activeExecutions: Collection<CommandExecution>, isHalt: boolean): Endpoint {
        const endpoint: ArgumentsConsumer = new TerminateCommandExecution(activeExecutions, isHalt);
        const endpointWithArguments: Endpoint = new EndpointWithArguments(endpoint, 'params', ['commandId', 'startTime']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, `${isHalt ? 'halt' : 'terminate'} execution of a command`);
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableEndpoint;
    }

    private constructor(private activeExecutions: Collection<CommandExecution>, private isHalt: boolean) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const id: any = {commandId: this.args.get('commandId'), startTime: parseInt(this.args.get('startTime'))};
        const execution: CommandExecution = await this.activeExecutions.findById(id);
        if (this.isHalt)  {
            execution.halt();
        } else {
            execution.terminate();
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