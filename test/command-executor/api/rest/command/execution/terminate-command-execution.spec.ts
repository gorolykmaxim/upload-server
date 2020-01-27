import {Collection} from "../../../../../../app/common/collection/collection";
import {CommandExecution} from "../../../../../../app/command-executor/command/command-execution";
import {Request, Response} from "express";
import {APIRequest} from "../../../../../../app/common/api/request";
import {deepEqual, instance, mock, verify, when} from "ts-mockito";
import {TerminateCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/terminate-command-execution";

describe('TerminateCommandExecution', function () {
    const commandId: string = '1';
    const startTime: number = 123456;
    const executionId: any = {commandId: commandId, startTime: startTime};
    let activeExecutions: Collection<CommandExecution>;
    let execution: CommandExecution;
    let executionInstance: CommandExecution;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        activeExecutions = mock<Collection<CommandExecution>>();
        execution = mock(CommandExecution);
        executionInstance = instance(execution);
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(reqMock.params).thenReturn({commandId: commandId, startTime: startTime.toString()});
        when(activeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
    });
    it('should terminate specified command execution', async function () {
        // given
        request = TerminateCommandExecution.createTerminate(instance(activeExecutions));
        // when
        await request.process(req, res);
        // then
        verify(execution.terminate()).once();
        verify(resMock.end()).once();
    });
    it('should halt specified command execution', async function () {
        // given
        request = TerminateCommandExecution.createHalt(instance(activeExecutions));
        // when
        await request.process(req, res);
        // then
        verify(execution.halt()).once();
        verify(resMock.end()).once();
    });
});