import {Application} from "../backend/application";
import {JsonDB} from "node-json-db";
import {anything, deepEqual, instance, mock, resetCalls, verify, when} from "ts-mockito";
import * as request from "supertest";
import {FileSystem} from "../backend/log-watcher/domain/file-system";
import {Stats} from "fs";

describe('log-watcher', function () {
    const baseUrl: string = '/api/log-watcher';
    const allowedLogs: Array<string> = [
        '/var/log/messages.log',
        '/var/log/apache2/access.log'
    ];
    const configPath: string = '/logs-view/logs';
    let jsonDB: JsonDB;
    let fileSystem: FileSystem;
    let application: Application;
    beforeEach(async function () {
        jsonDB = mock(JsonDB);
        fileSystem = mock<FileSystem>();
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn([].concat(allowedLogs));
        application = new Application(instance(jsonDB), instance(fileSystem));
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should initialize config on boot if it was not initialized', function () {
        // then
        verify(jsonDB.push(configPath, deepEqual([]))).once();
    });
    it('should return paths to all log files, that are allowed to be watched', async function () {
        //  when
        await request(application.app)
            .get(`${baseUrl}/log`)
            .expect(allowedLogs);
    });
    it('should fail to allow log to be watched since the absolute path is not specified in the request body', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/log`)
            .expect(400);
    });
    it('should not update configuration while allowing a log file to be watched, since the log file is already allowed to be watched', async function () {
        // given
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .post(`${baseUrl}/log`)
            .send({absolutePath: allowedLogs[0]})
            .expect(201);
        // then
        verify(jsonDB.push(configPath, anything())).never();
    });
    it('should update configuration while allowing a new log file to be watched', async function () {
        // given
        const newLogPath: string = '/a/b/c.log';
        const expectedUpdatedAllowedLogs: Array<string> = [].concat(allowedLogs);
        expectedUpdatedAllowedLogs.push(newLogPath);
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .post(`${baseUrl}/log`)
            .send({absolutePath: newLogPath})
            .expect(201);
        // then
        verify(jsonDB.push(configPath, deepEqual(expectedUpdatedAllowedLogs))).once();
    });
    it('should not show notice if the file, that is about to be allowed to be watched, exists', async function () {
        // when
        await request(application.app)
            .post(`${baseUrl}/log`)
            .send({absolutePath: allowedLogs[0]})
            .expect(201, {});
    });
    it('should show notice if the file, that is about to be allowed to be watched, does not exist', async function () {
        // given
        when(fileSystem.access(allowedLogs[0])).thenReject(new Error());
        // when
        await request(application.app)
            .post(`${baseUrl}/log`)
            .send({absolutePath: allowedLogs[0]})
            .expect(201, {notice: `Notice: the specified log file: '${allowedLogs[0]}' currently does not exist.`});
    });
    it('should fail to disallow log file watching since the absolute path to the file was not specified', async function () {
        // when
        await request(application.app)
            .delete(`${baseUrl}/log`)
            .expect(400);
    });
    it('should update configuration while trying to disallow watching a log file, that is allowed to be watched', async function () {
        // given
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .delete(`${baseUrl}/log`)
            .query({absolutePath: allowedLogs[0]})
            .expect(200);
        // then
        verify(jsonDB.push(configPath, deepEqual(allowedLogs.filter(l => l !== allowedLogs[0])))).once();
    });
    it('should not update configuration while trying to disallow watching a log file, that is not allowed to be watched in the first place', async function () {
        // given
        resetCalls(jsonDB);
        // when
        await request(application.app)
            .delete(`${baseUrl}/log`)
            .query({absolutePath: '/a/b/c.log'})
            .expect(200);
        // then
        verify(jsonDB.push(configPath, anything())).never();
    });
    it('should fail to get size of the log file since absolute path to the file was not specified', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/size`)
            .expect(400);
    });
    it('should fail to get size of the log file, that is not allowed to be watched', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/size`)
            .query({absolutePath: '/a/b/c.log'})
            .expect(403);
    });
    it('should get size of the log file', async function () {
        // given
        const stats: Stats = new Stats();
        stats.size = 12345;
        when(fileSystem.stat(allowedLogs[0])).thenResolve(stats);
        // when
        await request(application.app)
            .get(`${baseUrl}/log/size`)
            .query({absolutePath: allowedLogs[0]})
            .expect(200, {sizeInBytes: stats.size});
    });
    it('should fail to get size of the log file due to an unknown error', async function () {
        // given
        when(fileSystem.stat(allowedLogs[0])).thenReject(new Error());
        // when
        await request(application.app)
            .get(`${baseUrl}/log/size`)
            .query({absolutePath: allowedLogs[0]})
            .expect(500);
    });
});
