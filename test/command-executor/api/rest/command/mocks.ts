import {Command} from "../../../../../app/command-executor/command/command";
import {CommandFactory} from "../../../../../app/command-executor/command/command-factory";
import {Collection} from "../../../../../app/common/collection/collection";
import {Request, Response} from "express";
import {instance, mock, when} from "ts-mockito";

export class Mocks {
    readonly args = {name: 'list all files', script: 'ls -lh'};
    readonly commandMock: Command;
    readonly command: Command;
    readonly factory: CommandFactory;
    readonly commands: Collection<Command>;
    readonly reqMock: Request;
    readonly resMock: Response;
    readonly req: Request;
    readonly res: Response;

    constructor() {
        this.factory = mock(CommandFactory);
        this.commandMock = mock(Command);
        this.command = instance(this.commandMock);
        this.commands = mock<Collection<Command>>();
        this.reqMock = mock<Request>();
        this.resMock = mock<Response>();
        this.req = instance(this.reqMock);
        this.res = instance(this.resMock);
        when(this.commandMock.id).thenReturn('12345');
        when(this.commandMock.name).thenReturn(this.args.name);
        when(this.commandMock.script).thenReturn(this.args.script);
        when(this.commands.findAll()).thenResolve([this.command]);
        when(this.factory.create(this.args.name, this.args.script)).thenReturn(this.command);
        when(this.reqMock.body).thenReturn(this.args);
        when(this.commands.findById(this.command.id)).thenResolve(this.command);
        when(this.reqMock.params).thenReturn({commandId: this.command.id});
    }
}