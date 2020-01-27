import {ArgumentsConsumer, RequestWithArguments} from "../../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {CommandExecution} from "../../../../command/command-execution";
import {Collection, EntityNotFoundError} from "../../../../../common/collection/collection";
import {APIRequest} from "../../../../../common/api/request";
import {FailableRequest} from "../../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";

/**
 * Terminate or halt the specified command execution.
 */
export class TerminateCommandExecution implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Construct a request, that will terminate execution of the command.
     *
     * @param activeExecutions collection, that contains all active executions, that can be terminated
     */
    static createTerminate(activeExecutions: Collection<CommandExecution>): APIRequest {
        return this.create(activeExecutions, false);
    }

    /**
     * Construct a request, that will halt execution of the command.
     *
     * @param activeExecutions collection, that contains all active executions, that can be halt
     */
    static createHalt(activeExecutions: Collection<CommandExecution>): APIRequest {
        return this.create(activeExecutions, true);
    }

    private static create(activeExecutions: Collection<CommandExecution>, isHalt: boolean): APIRequest {
        const request: ArgumentsConsumer = new TerminateCommandExecution(activeExecutions, isHalt);
        const requestWithArguments: APIRequest = new RequestWithArguments(request, 'params', ['commandId', 'startTime']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, `${isHalt ? 'halt' : 'terminate'} execution of a command`);
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        failableRequest.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableRequest;
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