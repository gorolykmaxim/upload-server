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
 * Find all executions of the specified command.
 */
export class FindExecutionsOfCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param activeExecutions collection, where all currently active executions reside
     * @param completeExecutions collection, where all complete executions are stored
     */
    static create(activeExecutions: Collection<CommandExecution>, completeExecutions: Collection<CommandExecution>): APIRequest {
        const request: ArgumentsConsumer = new FindExecutionsOfCommand(activeExecutions, completeExecutions);
        const requestWithArguments: APIRequest = new RequestWithArguments(request, 'params', ['commandId']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'find executions of a command');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        failableRequest.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableRequest;
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