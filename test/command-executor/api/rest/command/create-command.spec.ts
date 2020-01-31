import {Endpoint} from "../../../../../app/common/api/endpoint";
import {instance, verify} from "ts-mockito";
import {CreateCommand} from "../../../../../app/command-executor/api/rest/command/create-command";
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";
import {Mocks} from "./mocks";

describe('CreateCommand', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = CreateCommand.create(instance(mocks.factory), instance(mocks.commands));
    });
    it('should create specified command and return information about it', async function () {
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.commands.add(mocks.command)).once();
        verify(mocks.resMock.end(JSON.stringify(new ExecutableCommand(mocks.command)))).once();
    });
});