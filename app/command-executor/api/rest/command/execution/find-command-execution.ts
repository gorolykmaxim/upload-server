import {ArgumentsConsumer, RequestWithArguments} from "../../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {APIRequest} from "../../../../../common/api/request";
import {FailableRequest} from "../../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";
import {CommandExecutionModel} from "./command-execution-model";

/**
 * Find detailed specified execution of the specified command including it's output.
 */
export class FindCommandExecution implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param activeExecutions collection that contains executions, that are currently being executed
     * @param completeExecutions collection that contains executions, that are complete
     */
    static create(activeExecutions: Collection<CommandExecution>, completeExecutions: Collection<CommandExecution>): APIRequest {
        const request: ArgumentsConsumer = new FindCommandExecution(activeExecutions, completeExecutions);
        const requestWithArguments: APIRequest = new RequestWithArguments(request, 'params', ['commandId', 'startTime']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'find execution of a command');
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
        const noSplit: boolean = req.query.noSplit === 'true';
        const id: any = {commandId: commandId, startTime: startTime};
        let execution: CommandExecution;
        if (await this.activeExecutions.contains(id)) {
            execution = await this.activeExecutions.findById(id);
        } else {
            execution = await this.completeExecutions.findById(id);
        }
        const response: CommandExecutionModel = new CommandExecutionModel(execution, noSplit);
        res.end(JSON.stringify(response));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}