import {APIRequest} from "../../../../../../app/common/api/request";
import {instance, verify} from "ts-mockito";
import {FindExecutionsOfCommand} from "../../../../../../app/command-executor/api/rest/command/execution/find-executions-of-command";
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";
import {Mocks} from "./mocks";

describe('FindExecutionsOfCommand', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = FindExecutionsOfCommand.create(instance(mocks.activeExecutions), instance(mocks.completeExecutions));
    });
    it('should find all active and complete executions of the specified command and return them in their historical order', async function () {
        // when
        await request.process(mocks.req, mocks.res);4
        // then
        verify(mocks.resMock.end(JSON.stringify([new CommandExecutionModel(mocks.activeExecution), new CommandExecutionModel(mocks.completeExecution)]))).once();
    });
});