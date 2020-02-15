import {JsonDB} from "node-json-db";
import {Application} from "../backend/application";
import {deepEqual, instance, mock, verify, when} from "ts-mockito";
import * as request from "supertest";

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
        // when
        await request(application.app)
            .get(`${baseUrl}/command`)
            .expect(200, [{name: 'list files', command: 'ls -lh'}, {name: 'kill pc', command: 'sudo rm -rf /'}]);
    });
});
