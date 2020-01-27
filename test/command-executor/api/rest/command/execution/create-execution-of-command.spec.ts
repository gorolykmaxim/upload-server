import {
    ExecutionStatus,
    FINISHED_STATUSES,
    OnOutputLine,
    OnStatusChange
} from "../../../../../../app/command-executor/command/command-execution";
import {capture, instance, verify} from "ts-mockito";
import {APIRequest} from "../../../../../../app/common/api/request";
import {CreateExecutionOfCommand} from "../../../../../../app/command-executor/api/rest/command/execution/create-execution-of-command";
import {expect} from "chai";
import {OutputChangedEvent, StatusChangedEvent} from "../../../../../../app/command-executor/api/events";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";
import {Mocks} from "./mocks";

describe('CreateExecutionOfCommand', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = CreateExecutionOfCommand.create(instance(mocks.commands), instance(mocks.activeExecutions),
            instance(mocks.completeExecutions), instance(mocks.executionEvents));
    });
    it('should create command execution and return information about it in the response', async function () {
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.activeExecutions.add(mocks.executionInstance)).once();
        verify(mocks.resMock.end(JSON.stringify(new CommandExecutionModel(mocks.executionInstance)))).once();
    });
    it('should dispatch status changed event each time the status of the created execution changes', async function () {
        // when
        await request.process(mocks.req, mocks.res);
        const changeStatus: OnStatusChange = capture(mocks.execution.addStatusListener).last()[0];
        await changeStatus(ExecutionStatus.failed);
        // then
        const dispatchedEvent: any = capture(mocks.executionEvents.dispatch).last()[0];
        expect(dispatchedEvent).eql(new StatusChangedEvent(mocks.executionInstance, ExecutionStatus.failed));
    });
    it('should dispatch output changed event each time the output of the created execution changes', async function () {
        // given
        const line = 'line 1';
        // when
        await request.process(mocks.req, mocks.res);
        const changeOutput: OnOutputLine = capture(mocks.execution.addOutputListener).last()[0];
        await changeOutput(line);
        // then
        const dispatchedEvent: any = capture(mocks.executionEvents.dispatch).last()[0];
        expect(dispatchedEvent).eql(new OutputChangedEvent(mocks.executionInstance, [line]));
    });
    it('should finalize execution when it finishes and move it from active executions to complete executions', async function () {
        // when
        for (let status of Array.from(FINISHED_STATUSES.values())) {
            await request.process(mocks.req, mocks.res);
            const changeStatus: OnStatusChange = capture(mocks.execution.addStatusListener).last()[0];
            await changeStatus(status);
        }
        // then
        verify(mocks.execution.finalize()).twice();
        verify(mocks.activeExecutions.remove(mocks.executionInstance)).twice();
        verify(mocks.completeExecutions.add(mocks.executionInstance)).twice();
    });
});