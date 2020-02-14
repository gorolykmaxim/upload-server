import {Application} from "../backend/application";
import {JsonDB} from "node-json-db";
import {deepEqual, instance, mock, verify, when} from "ts-mockito";
import * as request from "supertest";

describe('log-watcher', function () {
    const baseUrl: string = '/api/log-watcher';
    const allowedLogs: Array<string> = [
        '/var/log/messages.log',
        '/var/log/apache2/access.log'
    ];
    const configPath: string = '/logs-view/logs';
    let application: Application;
    let jsonDB: JsonDB;
    beforeEach(async function () {
        jsonDB = mock(JsonDB);
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn(allowedLogs);
        application = new Application(instance(jsonDB));
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should initialize config on boot if it was not initialized', function () {
        verify(jsonDB.push(configPath, deepEqual([]))).once();
    });
    it('should return paths to all log files, that are allowed to be watched', async function () {
        await request(application.app)
            .get(`${baseUrl}/log`)
            .expect(allowedLogs);
    });
});
