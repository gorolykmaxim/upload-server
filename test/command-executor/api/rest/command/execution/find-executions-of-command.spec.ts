import {Collection} from "../../../../../../app/common/collection/collection";
import {Request, Response} from "express";
import {APIRequest} from "../../../../../../app/common/api/request";
import {CommandExecution, ExecutionStatus} from "../../../../../../app/command-executor/command/command-execution";
import {instance, mock, verify, when} from "ts-mockito";
import {FindExecutionsOfCommand} from "../../../../../../app/command-executor/api/rest/command/execution/find-executions-of-command";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";

describe('FindExecutionsOfCommand', function () {
    const commandId: string = '12345';
    let activeExecutionMock: CommandExecution;
    let completeExecutionMock: CommandExecution;
    let anotherExecution: CommandExecution;
    let secondAnotherExecution: CommandExecution;
    let activeExecution: CommandExecution;
    let completeExecution: CommandExecution;
    let activeExecutions: Collection<CommandExecution>;
    let completeExecutions: Collection<CommandExecution>;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        activeExecutionMock = mock(CommandExecution);
        completeExecutionMock = mock(CommandExecution);
        anotherExecution = mock(CommandExecution);
        secondAnotherExecution = mock(CommandExecution);
        activeExecution = instance(activeExecutionMock);
        completeExecution = instance(completeExecutionMock);
        activeExecutions = mock<Collection<CommandExecution>>();
        completeExecutions = mock<Collection<CommandExecution>>();
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(reqMock.params).thenReturn({commandId: commandId});
        when(activeExecutionMock.commandId).thenReturn(commandId);
        when(activeExecutionMock.startTime).thenReturn(2);
        when(activeExecutionMock.getStatus()).thenReturn(ExecutionStatus.executing);
        when(completeExecutionMock.commandId).thenReturn(commandId);
        when(completeExecutionMock.startTime).thenReturn(1);
        when(completeExecutionMock.getStatus()).thenReturn(ExecutionStatus.finished);
        when(anotherExecution.commandId).thenReturn('123');
        when(secondAnotherExecution.commandId).thenReturn('312');
        when(activeExecutions.findAll()).thenResolve([
            activeExecution, instance(anotherExecution)
        ]);
        when(completeExecutions.findAll()).thenResolve([
            completeExecution, instance(secondAnotherExecution)
        ]);
        request = FindExecutionsOfCommand.create(instance(activeExecutions), instance(completeExecutions));
    });
    it('should find all active and complete executions of the specified command and return them in their historical order', async function () {
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify([new CommandExecutionModel(activeExecution), new CommandExecutionModel(completeExecution)]))).once();
    });
});