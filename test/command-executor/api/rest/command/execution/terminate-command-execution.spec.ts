import {APIRequest} from "../../../../../../app/common/api/request";
import {instance, verify} from "ts-mockito";
import {TerminateCommandExecution} from "../../../../../../app/command-executor/api/rest/command/execution/terminate-command-execution";
import {Mocks} from "./mocks";

describe('TerminateCommandExecution', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
    });
    it('should terminate specified command execution', async function () {
        // given
        request = TerminateCommandExecution.createTerminate(instance(mocks.activeExecutions));
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.execution.terminate()).once();
        verify(mocks.resMock.end()).once();
    });
    it('should halt specified command execution', async function () {
        // given
        request = TerminateCommandExecution.createHalt(instance(mocks.activeExecutions));
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.execution.halt()).once();
        verify(mocks.resMock.end()).once();
    });
});