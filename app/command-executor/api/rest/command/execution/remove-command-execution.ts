import {ArgumentsConsumer, RequestWithArguments} from "../../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {APIRequest} from "../../../../../common/api/request";
import {FailableRequest} from "../../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";

/**
 * Remove specified command execution. If execution is currently active - it will be halt abruptly and then removed.
 */
export class RemoveCommandExecution implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Construct a request.
     *
     * @param activeExecutions collection where all active executions are stored
     * @param completeExecutions collection where all complete executions are stored
     */
    static create(activeExecutions: Collection<CommandExecution>,
                  completeExecutions: Collection<CommandExecution>): APIRequest {
        const request: ArgumentsConsumer = new RemoveCommandExecution(activeExecutions, completeExecutions);
        const requestWithArguments: APIRequest = new RequestWithArguments(request, 'params', ['commandId', 'startTime']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'remove execution of a command');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        failableRequest.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableRequest;
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