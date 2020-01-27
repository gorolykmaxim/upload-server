import {ArgumentsConsumer, RequestWithArguments} from "../../../../../common/api/request-with-arguments";
import {Arguments} from "../../../../../common/arguments";
import {Request, Response} from "express";
import {Command} from "../../../../command/command";
import {CommandExecution, FINISHED_STATUSES} from "../../../../command/command-execution";
import {OutputChangedEvent, StatusChangedEvent} from "../../../events";
import {Collection} from "../../../../../common/collection/collection";
import {Events} from "../../../../../common/events";
import {FailableRequest} from "../../../../../common/api/failable-request";
import {ArgumentError} from "common-errors";
import {CommandExecutionModel} from "./command-execution-model";

/**
 * Start a new execution of the specified command.
 */
export class CreateExecutionOfCommand implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param commands collection, where the command is located
     * @param activeExecutions collection, where the created execution will be stored while being executing
     * @param completeExecutions collection, where the execution will be moved to after completion
     * @param executionEvents events array, where events about the created execution will be dispatched
     */
    static create(commands: Collection<Command>, activeExecutions: Collection<CommandExecution>,
                  completeExecutions: Collection<CommandExecution>, executionEvents: Events) {
        const request: ArgumentsConsumer = new CreateExecutionOfCommand(commands, activeExecutions, completeExecutions,
            executionEvents);
        const requestWithArguments = new RequestWithArguments(request, 'params', ['commandId']);
        const failableRequest = new FailableRequest(requestWithArguments, 'start a new execution of a command');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        return failableRequest;
    }

    private constructor(private commands: Collection<Command>, private activeExecutions: Collection<CommandExecution>,
                        private completeExecutions: Collection<CommandExecution>, private executionEvents: Events) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const command: Command = await this.commands.findById(this.args.get('commandId'));
        const execution: CommandExecution = command.execute();
        await this.activeExecutions.add(execution);
        execution.addStatusListener(async (status) => {
            this.executionEvents.dispatch(new StatusChangedEvent(execution, status));
            if (FINISHED_STATUSES.has(status)) {
                execution.finalize();
                await this.activeExecutions.remove(execution);
                await this.completeExecutions.add(execution);
            }
        });
        execution.addOutputListener(output => {
            this.executionEvents.dispatch(new OutputChangedEvent(execution, [output]));
        });
        const response: CommandExecutionModel = new CommandExecutionModel(execution);
        res.end(JSON.stringify(response));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}