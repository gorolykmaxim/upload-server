import {Request, Response} from "express";
import {FindAllCommands} from "../../../../../app/command-executor/api/rest/command/find-all-commands";
import {Collection} from "../../../../../app/common/collection/collection";
import {Command} from "../../../../../app/command-executor/command/command";
import {instance, mock, verify, when} from "ts-mockito";
import {APIRequest} from "../../../../../app/common/api/request";
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";

describe('FindAllCommands', function () {
    let commandMock: Command;
    let command: Command;
    let commands: Collection<Command>;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        commandMock = mock(Command);
        command = instance(commandMock);
        commands = mock<Collection<Command>>();
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(commandMock.id).thenReturn('12345');
        when(commandMock.name).thenReturn('list all files');
        when(commandMock.script).thenReturn('ls -lh');
        when(commands.findAll()).thenResolve([command]);
        request = FindAllCommands.create(instance(commands));
    });
    it('should find all commands, that can be executed', async function () {
        // when
        await request.process(req, res);
        // then
        verify(resMock.end(JSON.stringify([new ExecutableCommand(command)]))).once();
    });
});