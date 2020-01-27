import {deepEqual, instance, verify, when} from "ts-mockito";
import {APIRequest} from "../../../../../../app/common/api/request";
import {RemoveCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/remove-command-execution";
import {Mocks} from "./mocks";

describe('RemoveCommandExecution', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = RemoveCommandExecution.create(instance(mocks.activeExecutions), instance(mocks.completeExecutions));
    });
    it('should halt running command and remove it', async function () {
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.execution.haltAbruptly()).once();
        verify(mocks.activeExecutions.remove(mocks.executionInstance)).once();
        verify(mocks.resMock.end()).once();
    });
    it('should remove complete command', async function () {
        // given
        when(mocks.activeExecutions.contains(deepEqual(mocks.executionId))).thenResolve(false);
        when(mocks.completeExecutions.findById(deepEqual(mocks.executionId))).thenResolve(mocks.executionInstance);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.completeExecutions.remove(mocks.executionInstance)).once();
        verify(mocks.resMock.end()).once();
    });
});