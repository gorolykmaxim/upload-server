import {Command} from "../../../../../app/command-executor/command/command";
import {Collection} from "../../../../../app/common/collection/collection";
import {Request, Response} from "express";
import {APIRequest} from "../../../../../app/common/api/request";
import {CommandFactory} from "../../../../../app/command-executor/command/command-factory";
import {instance, mock, verify, when} from "ts-mockito";
import {CreateCommand} from "../../../../../app/command-executor/api/rest/command/create-command";
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";

describe('CreateCommand', function () {
    const args = {name: 'list all files', script: 'ls -lh'};
    let commandMock: Command;
    let command: Command;
    let factory: CommandFactory;
    let commands: Collection<Command>;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: APIRequest;
    beforeEach(function () {
        factory = mock(CommandFactory);
        commandMock = mock(Command);
        command = instance(commandMock);
        commands = mock<Collection<Command>>();
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        when(commandMock.id).thenReturn('12345');
        when(commandMock.name).thenReturn(args.name);
        when(commandMock.script).thenReturn(args.script);
        when(factory.create(args.name, args.script)).thenReturn(command);
        when(reqMock.body).thenReturn(args);
        request = CreateCommand.create(instance(factory), instance(commands));
    });
    it('should create specified command and return information about it', async function () {
        // when
        await request.process(req, res);
        // then
        verify(commands.add(command)).once();
        verify(resMock.end(JSON.stringify(new ExecutableCommand(command)))).once();
    });
});