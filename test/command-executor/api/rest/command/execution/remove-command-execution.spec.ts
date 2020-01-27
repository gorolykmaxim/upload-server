import {Collection} from "../../../../../../app/common/collection/collection";
import {CommandExecution} from "../../../../../../app/command-executor/command/command-execution";
import {Request, Response} from "express";
import {anything, deepEqual, instance, mock, verify, when} from "ts-mockito";
import {APIRequest} from "../../../../../../app/common/api/request";
import {RemoveCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/remove-command-execution";

describe('RemoveCommandExecution', function () {
    const commandId: string = '1';
    const startTime: number = 123456;
    const executionId: any = {commandId: commandId, startTime: startTime};
    let activeExecutions: Collection<CommandExecution>;
    let completeExecutions: Collection<CommandExecution>;
    let execution: CommandExecution;
    let executionInstance: CommandExecution;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        activeExecutions = mock<Collection<CommandExecution>>();
        completeExecutions = mock<Collection<CommandExecution>>();
        execution = mock(CommandExecution);
        executionInstance = instance(execution);
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(reqMock.params).thenReturn({commandId: commandId, startTime: startTime.toString()});
        when(resMock.status(anything())).thenReturn(res);
        when(activeExecutions.contains(deepEqual(executionId))).thenResolve(true);
        when(activeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
        request = RemoveCommandExecution.create(instance(activeExecutions), instance(completeExecutions));
    });
    it('should halt running command and remove it', async function () {
        // when
        await request.process(req, res);
        // then
        verify(execution.haltAbruptly()).once();
        verify(activeExecutions.remove(executionInstance)).once();
        verify(resMock.end()).once();
    });
    it('should remove complete command', async function () {
        // given
        when(activeExecutions.contains(deepEqual(executionId))).thenResolve(false);
        when(completeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
        // when
        await request.process(req, res);
        // then
        verify(completeExecutions.remove(executionInstance)).once();
        verify(resMock.end()).once();
    });
});