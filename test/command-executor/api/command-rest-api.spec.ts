import {URL} from "../../../app/common/url";
import {
    APIError,
    CommandRestAPI,
    CommandURL,
    ExecutableCommand
} from "../../../app/command-executor/api/command-rest-api";
import uuid = require("uuid");
import { expect } from "chai";
import {Application, Request, Response} from "express";
import {CommandFactory} from "../../../app/command-executor/command/command-factory";
import {Collection, EntityNotFoundError} from "../../../app/common/collection/collection";
import {Command} from "../../../app/command-executor/command/command";
import {anything, capture, instance, mock, verify, when} from "ts-mockito";
import {ArgumentError} from "common-errors";

describe('CommandRestAPI', function () {
    const baseURL: URL = URL.createNew('api').append('command-executor');
    const command: Command = new Command('12345', 'list files', 'ls', null, null, null);
    const commandURL: CommandURL = CommandURL.createFrom(baseURL.append('command'));
    const executableCommand: ExecutableCommand = new ExecutableCommand(command, commandURL, commandURL.append('execution'));
    const expectedError: Error = new Error();
    const expectedEntityNotFoundError: EntityNotFoundError = new EntityNotFoundError(command.id);
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let server: Application;
    let factory: CommandFactory;
    let commands: Collection<Command>;
    let api: CommandRestAPI;
    let findAllCommands: Function;
    let createCommand: Function;
    let removeCommand: Function;
    beforeEach(function () {
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        server = mock<Application>();
        factory = mock(CommandFactory);
        commands = mock<Collection<Command>>();
        when(reqMock.params).thenReturn({'commandId': command.id});
        when(reqMock.body).thenReturn({'name': command.name, 'script': command.script});
        when(resMock.status(anything())).thenReturn(res);
        when(commands.findAll()).thenResolve([command]);
        when(commands.findById(command.id)).thenResolve(command);
        when(factory.create(command.name, command.script)).thenReturn(command);
        api = new CommandRestAPI(instance(server), baseURL, instance(factory), instance(commands));
        findAllCommands = capture(server.get).last()[1];
        createCommand = capture(server.post).last()[1];
        removeCommand = capture(server.delete).last()[1];
    });
    it('should find all commands, that can be executed', async function () {
        // when
        await findAllCommands(req, res);
        // then
        verify(resMock.end(JSON.stringify([executableCommand]))).once();
    });
    it('should fail to find all commands, that can be executed', async function () {
        // given
        when(commands.findAll()).thenReject(expectedError);
        // when
        await findAllCommands(req, res);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.commandsLookup(expectedError).message)).once();
    });
    it('should create a new command, save it and return it', async function () {
        // when
        await createCommand(req, res);
        // then
        verify(commands.add(command)).once();
        verify(resMock.end(JSON.stringify(executableCommand))).once();
    });
    it('should fail to create a new command due to missing mandatory arguments', async function () {
        // given
        when(reqMock.body).thenReturn({});
        // when
        await createCommand(req, res);
        // then
        verify(commands.add(command)).never();
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.commandCreation(undefined, undefined, new ArgumentError('name, script')).message));
    });
    it('should fail to create a new command', async function () {
        // given
        when(commands.add(command)).thenReject(expectedError);
        // when
        await createCommand(req, res);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.commandCreation(command.name, command.script, expectedError).message)).once();
    });
    it('should remove a command', async function () {
        // when
        await removeCommand(req, res);
        // then
        verify(commands.remove(command)).once();
        verify(resMock.end()).once();
    });
    it('should fail to remove a command since ID of the command to be removed is missing', async function () {
        // given
        when(reqMock.params).thenReturn({});
        // when
        await removeCommand(req, res);
        // then
        verify(commands.remove(command)).never();
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.commandRemoval(undefined, new ArgumentError('commandId')).message)).once();
    });
    it('should fail to remove a command since command with the specified ID does not exist', async function () {
        // given
        when(commands.findById(command.id)).thenReject(expectedEntityNotFoundError);
        // when
        await removeCommand(req, res);
        // then
        verify(commands.remove(command)).never();
        verify(resMock.status(404)).once();
        verify(resMock.end(APIError.commandRemoval(command.id, expectedEntityNotFoundError).message)).once();
    });
    it('should fail to remove a command', async function () {
        // given
        when(commands.remove(command)).thenReject(expectedError);
        // when
        await removeCommand(req, res);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.commandRemoval(command.id, expectedError).message)).once();
    });
});

describe('ExecutableCommand', function () {
    const commandURL: CommandURL = CommandURL.createFrom(URL.createNew('api').append('command-executor').append('command'));
    const command: Command = new Command(uuid(), 'list files', 'ls -lh', null, null, null);
    const executableCommand: ExecutableCommand = new ExecutableCommand(command, commandURL, commandURL.append('execution'));
    it('should create executable command with the specified ID', function () {
        // then
        expect(executableCommand.id).equal(command.id);
    });
    it('should create executable command with the specified name', function () {
        // then
        expect(executableCommand.name).equal(command.name);
    });
    it('should create executable command with the specified script', function () {
        // then
        expect(executableCommand.script).equal(command.script);
    });
    it('should create executable command with the specified remove HTTP link', function () {
        // then
        expect(executableCommand.httpLinks.remove).equal(`/api/command-executor/command/${command.id}`);
    });
    it('should create executable command with the specified get execution history HTTP link', function () {
        // then
        expect(executableCommand.httpLinks.getExecutionHistory).equal(`/api/command-executor/command/${command.id}/execution`);
    });
    it('should create executable command with the specified execute HTTP link', function () {
        // then
        expect(executableCommand.httpLinks.execute).equal(`/api/command-executor/command/${command.id}/execution`);
    });
});