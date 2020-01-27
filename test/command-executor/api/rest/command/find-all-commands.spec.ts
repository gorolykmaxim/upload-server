import {FindAllCommands} from "../../../../../app/command-executor/api/rest/command/find-all-commands";
import {instance, verify} from "ts-mockito";
import {APIRequest} from "../../../../../app/common/api/request";
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";
import {Mocks} from "./mocks";

describe('FindAllCommands', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = FindAllCommands.create(instance(mocks.commands));
    });
    it('should find all commands, that can be executed', async function () {
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify([new ExecutableCommand(mocks.command)]))).once();
    });
});