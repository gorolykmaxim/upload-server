import {Collection} from "../../../../../../app/common/collection/collection";
import {Command} from "../../../../../../app/command-executor/command/command";
import {
    CommandExecution,
    ExecutionStatus, FINISHED_STATUSES, OnOutputLine,
    OnStatusChange
} from "../../../../../../app/command-executor/command/command-execution";
import {Events} from "../../../../../../app/common/events";
import {Request, Response} from "express";
import {capture, instance, mock, verify, when} from "ts-mockito";
import {EOL} from "os";
import {APIRequest} from "../../../../../../app/common/api/request";
import {CreateExecutionOfCommand} from "../../../../../../app/command-executor/api/rest/command/execution/create-execution-of-command";
import {expect} from "chai";
import {OutputChangedEvent, StatusChangedEvent} from "../../../../../../app/command-executor/api/events";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";

describe('CreateExecutionOfCommand', function () {
    const commandId: string = '1';
    const startTime: number = 123456;
    let commands: Collection<Command>;
    let activeExecutions: Collection<CommandExecution>;
    let completeExecutions: Collection<CommandExecution>;
    let command: Command;
    let execution: CommandExecution;
    let executionInstance: CommandExecution;
    let executionEvents: Events;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        commands = mock<Collection<Command>>();
        activeExecutions = mock<Collection<CommandExecution>>();
        completeExecutions = mock<Collection<CommandExecution>>();
        executionEvents = mock(Events);
        command = mock(Command);
        execution = mock(CommandExecution);
        executionInstance = instance(execution);
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(commands.findById(commandId)).thenResolve(instance(command));
        when(command.execute()).thenReturn(executionInstance);
        when(execution.commandId).thenReturn(commandId);
        when(execution.startTime).thenReturn(startTime);
        when(execution.eol).thenReturn(EOL);
        when(execution.getStatus()).thenReturn(ExecutionStatus.executing);
        when(reqMock.params).thenReturn({commandId: commandId});
        request = CreateExecutionOfCommand.create(instance(commands), instance(activeExecutions), instance(completeExecutions), instance(executionEvents));
    });
    it('should create command execution and return information about it in the response', async function () {
        // when
        await request.process(req, res);
        // then
        verify(activeExecutions.add(executionInstance)).once();
        verify(resMock.end(JSON.stringify(new CommandExecutionModel(executionInstance)))).once();
    });
    it('should dispatch status changed event each time the status of the created execution changes', async function () {
        // when
        await request.process(req, res);
        const changeStatus: OnStatusChange = capture(execution.addStatusListener).last()[0];
        await changeStatus(ExecutionStatus.failed);
        // then
        const dispatchedEvent: any = capture(executionEvents.dispatch).last()[0];
        expect(dispatchedEvent).eql(new StatusChangedEvent(executionInstance, ExecutionStatus.failed));
    });
    it('should dispatch output changed event each time the output of the created execution changes', async function () {
        // given
        const line = 'line 1';
        // when
        await request.process(req, res);
        const changeOutput: OnOutputLine = capture(execution.addOutputListener).last()[0];
        await changeOutput(line);
        // then
        const dispatchedEvent: any = capture(executionEvents.dispatch).last()[0];
        expect(dispatchedEvent).eql(new OutputChangedEvent(executionInstance, [line]));
    });
    it('should finalize execution when it finishes and move it from active executions to complete executions', async function () {
        // when
        for (let status of Array.from(FINISHED_STATUSES.values())) {
            await request.process(req, res);
            const changeStatus: OnStatusChange = capture(execution.addStatusListener).last()[0];
            await changeStatus(status);
        }
        // then
        verify(execution.finalize()).twice();
        verify(activeExecutions.remove(executionInstance)).twice();
        verify(completeExecutions.add(executionInstance)).twice();
    });
});