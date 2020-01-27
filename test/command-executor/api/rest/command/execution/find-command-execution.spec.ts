import {APIRequest} from "../../../../../../app/common/api/request";
import {deepEqual, instance, verify, when} from "ts-mockito";
import {FindCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/find-command-execution";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";
import {Mocks} from "./mocks";

describe('FindCommandExecution', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = FindCommandExecution.create(instance(mocks.activeExecutions), instance(mocks.completeExecutions));
    });
    it('should find execution in active executions', async function () {
        // given
        when(mocks.activeExecutions.contains(deepEqual(mocks.executionId))).thenResolve(true);
        when(mocks.activeExecutions.findById(deepEqual(mocks.executionId))).thenResolve(mocks.executionInstance);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify(new CommandExecutionModel(mocks.executionInstance, false)))).once();
    });
    it('should find execution in complete executions', async function () {
        // given
        when(mocks.activeExecutions.contains(deepEqual(mocks.executionId))).thenResolve(false);
        when(mocks.completeExecutions.findById(deepEqual(mocks.executionId))).thenResolve(mocks.executionInstance);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify(new CommandExecutionModel(mocks.executionInstance, false)))).once();
    });
    it('should find execution with output split into lines', async function () {
        // given
        when(mocks.reqMock.query).thenReturn({noSplit: 'false'});
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify(new CommandExecutionModel(mocks.executionInstance, false)))).once();
    });
    it('should find execution with output as a single string', async function () {
        // given
        when(mocks.reqMock.query).thenReturn({noSplit: 'true'});
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify(new CommandExecutionModel(mocks.executionInstance, true)))).once();
    });
});