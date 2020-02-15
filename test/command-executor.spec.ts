import {JsonDB} from "node-json-db";
import {Application} from "../backend/application";
import {anything, deepEqual, instance, mock, resetCalls, verify, when} from "ts-mockito";
import * as request from "supertest";
import {Command} from "../backend/command-executor/domain/command";

describe('command-executor', function () {
    const baseUrl: string = '/api/command-executor';
    const executableCommands: any = {
        'list files': {
            'command': 'ls -lh'
        },
        'kill pc': {
            'command': 'sudo rm -rf /'
        }
    };
    const command: Command = new Command('list files', 'ls -lh');
    const configPath: string = '/command-executor';
    let jsonDB: JsonDB;
    let application: Application;
    beforeEach(async function () {
        jsonDB = mock(JsonDB);
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn(executableCommands);
        application = new Application(null, instance(jsonDB));
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should initialize command repository if it was not previously initialized', function () {
        // then
        verify(jsonDB.push(configPath, deepEqual({}))).once();
    });
    it('should return list of all executable commands', async function () {
        // given
        const expectedCommands: Array<any> = [
            new Command('list files', 'ls -lh'),
            new Command('kill pc', 'sudo rm -rf /')
        ].map(c => {return {id: c.id, name: c.name, command: c.command}});
        // when
        await request(application.app)
            .get(`${baseUrl}/command`)
            .expect(200, expectedCommands);
    });
    it('should fail to create a new command since commands name is missing', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({})
            .expect(400);
    });
    it('should fail to create a new command since commands "command" is missing', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: 'monitor processes'})
            .expect(400);
    });
    it('should create a new command', async function () {
        // given
        const command: Command = new Command('monitor process', 'top -C');
        // when
        await request(application.app)
            .post(`${baseUrl}/command`)
            .send({name: command.name, command: command.command})
            .expect(201, {id: command.id, name: command.name, command: command.command});
        // then
        verify(jsonDB.push(`${configPath}/${command.name}`, deepEqual({command: command.command}))).once();
    });
    it('should remove command with the specified ID', async function () {
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/${command.id}`)
            .expect(200);
        // then
        verify(jsonDB.push(configPath, deepEqual({'kill pc': {'command': 'sudo rm -rf /'}}))).once();
    });
    it('should not try to remove a command that does not exist', async function () {
        // given
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .delete(`${baseUrl}/command/36475657`)
            .expect(200);
        // then
        verify(jsonDB.push(anything(), anything())).never();
    });
});
