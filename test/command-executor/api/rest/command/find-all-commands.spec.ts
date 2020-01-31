import {FindAllCommands} from "../../../../../app/command-executor/api/rest/command/find-all-commands";
import {instance, verify} from "ts-mockito";
import {Endpoint} from "../../../../../app/common/api/endpoint";
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";
import {Mocks} from "./mocks";

describe('FindAllCommands', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = FindAllCommands.create(instance(mocks.commands));
    });
    it('should find all commands, that can be executed', async function () {
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify([new ExecutableCommand(mocks.command)]))).once();
    });
});