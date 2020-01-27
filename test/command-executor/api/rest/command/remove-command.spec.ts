import {Command} from "../../../../../app/command-executor/command/command";
import {Collection} from "../../../../../app/common/collection/collection";
import {Request, Response} from "express";
import {APIRequest} from "../../../../../app/common/api/request";
import {instance, mock, verify, when} from "ts-mockito";
import {RemoveCommand} from "../../../../../app/command-executor/api/rest/command/remove-command";

describe('RemoveCommand', function () {
    const commandId: string = '123453';
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
        when(commands.findById(commandId)).thenResolve(command);
        when(reqMock.params).thenReturn({commandId: commandId});
        request = RemoveCommand.create(instance(commands));
    });
    it('should remove command with the specified ID', async function () {
        // when
        await request.process(req, res);
        // then
        verify(commands.remove(command)).once();
        verify(resMock.end()).once();
    });
});