import {Endpoint} from "../../../../../app/common/api/endpoint";
import {instance, verify} from "ts-mockito";
import {RemoveCommand} from "../../../../../app/command-executor/api/rest/command/remove-command";
import {Mocks} from "./mocks";

describe('RemoveCommand', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = RemoveCommand.create(instance(mocks.commands));
    });
    it('should remove command with the specified ID', async function () {
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.commands.remove(mocks.command)).once();
        verify(mocks.resMock.end()).once();
    });
});