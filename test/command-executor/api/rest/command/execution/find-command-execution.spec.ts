import {Collection} from "../../../../../../app/common/collection/collection";
import {CommandExecution, ExecutionStatus} from "../../../../../../app/command-executor/command/command-execution";
import {Request, Response} from "express";
import {APIRequest} from "../../../../../../app/common/api/request";
import {anything, deepEqual, instance, mock, verify, when} from "ts-mockito";
import {EOL} from "os";
import {FindCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/find-command-execution";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";

describe('FindCommandExecution', function () {
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
        when(execution.commandId).thenReturn(commandId);
        when(execution.startTime).thenReturn(startTime);
        when(execution.eol).thenReturn(EOL);
        when(execution.getStatus()).thenReturn(ExecutionStatus.executing);
        when(execution.getOutputAsString()).thenReturn(`line 1${EOL}line 2${EOL}`);
        when(execution.getOutputLines()).thenReturn(['line 1', 'line 2']);
        when(reqMock.params).thenReturn({commandId: commandId, startTime: startTime.toString()});
        when(resMock.status(anything())).thenReturn(res);
        when(activeExecutions.contains(deepEqual(executionId))).thenResolve(true);
        when(activeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
        request = FindCommandExecution.create(instance(activeExecutions), instance(completeExecutions));
    });
    it('should find execution in active executions', async function () {
        // given
        when(activeExecutions.contains(deepEqual(executionId))).thenResolve(true);
        when(activeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify(new CommandExecutionModel(executionInstance, false)))).once();
    });
    it('should find execution in complete executions', async function () {
        // given
        when(activeExecutions.contains(deepEqual(executionId))).thenResolve(false);
        when(completeExecutions.findById(deepEqual(executionId))).thenResolve(executionInstance);
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify(new CommandExecutionModel(executionInstance, false)))).once();
    });
    it('should find execution with output split into lines', async function () {
        // given
        when(reqMock.query).thenReturn({noSplit: 'false'});
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify(new CommandExecutionModel(executionInstance, false)))).once();
    });
    it('should find execution with output as a single string', async function () {
        // given
        when(reqMock.query).thenReturn({noSplit: 'true'});
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify(new CommandExecutionModel(executionInstance, true)))).once();
    });
});