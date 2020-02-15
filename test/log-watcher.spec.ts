import {Application} from "../backend/application";
import {JsonDB} from "node-json-db";
import {anything, deepEqual, instance, mock, resetCalls, verify, when} from "ts-mockito";
import * as request from "supertest";
import {FileSystem} from "../backend/log-watcher/domain/file-system";
import {Stats} from "fs";
import {EOL} from "os";
import {DummyWebSocket, DummyWebSocketServer, mockWebSocketExpress} from "./web-socket";
import {expect} from "chai";
import * as chai from "chai";
import {FileWatcher} from "../backend/log-watcher/domain/file-watcher";
import {LogFileAccessError} from "../backend/log-watcher/domain/log-file-access-error";
import {from, ReplaySubject, Subject, throwError, TimeoutError} from "rxjs";
import {map, mergeMap, take, timeout, toArray} from "rxjs/operators";
import {Database} from "sqlite";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('log-watcher', function () {
    const baseUrl: string = '/api/log-watcher';
    const allowedLogs: Array<string> = [
        '/var/log/messages.log',
        '/var/log/apache2/access.log'
    ];
    const configPath: string = '/logs-view/logs';
    const content: Buffer = Buffer.from(`line 1${EOL}line 2`);
    const changes: Array<string> = ['line 3', 'line 4', 'line 5'];
    const database: Database = mock<Database>();
    let jsonDB: JsonDB;
    let fileSystem: FileSystem;
    let fileWatcher: FileWatcher;
    let express: any;
    let wss: DummyWebSocketServer;
    let application: Application;
    beforeEach(async function () {
        express = mockWebSocketExpress();
        wss = express.dummyWebSocketServer;
        jsonDB = mock(JsonDB);
        fileSystem = mock<FileSystem>();
        fileWatcher = mock<FileWatcher>();
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn([].concat(allowedLogs));
        when(fileSystem.readFile(allowedLogs[0])).thenResolve(content);
        when(fileWatcher.watch(allowedLogs[0])).thenReturn(from(changes));
        application = new Application(express, instance(jsonDB), instance(fileSystem), instance(fileWatcher), null, null, instance(database));
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
    it('should fail to get content of the log file since absolute path to the file was not specified', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .expect(400);
    });
    it('should fail to get content of the log file, that is not allowed to be watched', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .query({absolutePath: '/a/b/c.log'})
            .expect(403);
    });
    it('should get content of the specified log file as an array of its lines by default', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .query({absolutePath: allowedLogs[0]})
            .expect(200, {content: content.toString().split(EOL)});
    });
    it('should get content of the specified log file as an array of its lines', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .query({absolutePath: allowedLogs[0], noSplit: 'false'})
            .expect(200, {content: content.toString().split(EOL)});
    });
    it('should get content of the specified log file as a single string', async function () {
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .query({absolutePath: allowedLogs[0], noSplit: 'true'})
            .expect(200, {content: content.toString()});
    });
    it('should fail to get content of the log file due to an unknown error', async function () {
        // given
        when(fileSystem.readFile(allowedLogs[0])).thenReject(new Error());
        // when
        await request(application.app)
            .get(`${baseUrl}/log/content`)
            .query({absolutePath: allowedLogs[0]})
            .expect(500);
    });
    it('should fail to watch log file since absolute path was not specified', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {});
        // then
        verify(fileWatcher.watch(anything())).never();
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('absolutePath is required.');
    });
    it('should fail to watch log file, that is not allowed to be watched', async function () {
        // given
        const logPath: string = '/a/b/c.log';
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {absolutePath: logPath});
        // then
        verify(fileWatcher.watch(anything())).never();
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal(new LogFileAccessError(logPath).message);
    });
    it('should watch log file from the beginning', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {absolutePath: allowedLogs[0], fromStart: 'true'});
        // then
        const lines: Array<string> = await socket.messages.pipe(
            take(4),
            map(c => c.changes),
            mergeMap(v => v),
            toArray<string>()
        ).toPromise();
        expect(lines).eql(content.toString().split(EOL).concat(changes));
    });
    it('should fail to read existing log contents and immediately disconnect', async function () {
        // given
        when(fileSystem.readFile(allowedLogs[0])).thenReject(new Error('error'));
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {absolutePath: allowedLogs[0], fromStart: 'true'});
        await socket.closeEvent.toPromise();
        // then
        verify(fileWatcher.watch(allowedLogs[0])).never();
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Failed to read content of log file /var/log/messages.log. Reason: error');
    });
    it('should watch log file from the most recent change', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {absolutePath: allowedLogs[0]});
        // then
        const lines: Array<string> = await socket.messages.pipe(
            take(3),
            map(c => c.changes),
            mergeMap(v => v),
            toArray<string>()
        ).toPromise();
        expect(lines).eql(changes);
    });
    it('should fail to watch log file from the most recent change and immediately disconnect', async function () {
        // given
        when(fileWatcher.watch(allowedLogs[0])).thenReturn(throwError(new Error('error')));
        // when
        const socket: DummyWebSocket = await wss.connect(`${baseUrl}/log`, {absolutePath: allowedLogs[0]});
        // then
        expect(socket.closeCode).equal(1008);
        expect(socket.closeMessage).equal('Failed to watch content changes in log file /var/log/messages.log. Reason: error');
    });
    it('should fail to watch log file using legacy API, since the type of message is not specified', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'type is required.'});
    });
    it('should fail to watch log file using legacy API, since the type of message is not supported', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'random'});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'type must be either watch or unwatch.'});
    });
    it('should fail to watch log file using legacy API, since the file is not specified', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch'});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'file is required.'});
    });
    it('should fail to watch log file using legacy API, since the file is not allowed to be watched', async function () {
        // given
        const logPath: string = '/a/b/c.log';
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: logPath});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: new LogFileAccessError(logPath).message});
    });
    it('should include path to file and message type "change" in each change message in the legacy API', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0], fromStart: true});
        // then
        const messages: Array<any> = await socket.messages.pipe(take(4), toArray()).toPromise();
        for (let change of messages) {
            expect(change.type).equal('change');
            expect(change.file).equal(allowedLogs[0]);
        }
    });
    it('should watch log file from start using legacy API', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0], fromStart: true});
        // then
        const lines: Array<string> = await socket.messages.pipe(
            take(4),
            map(c => c.changes),
            mergeMap(v => v),
            toArray<string>()
        ).toPromise();
        expect(lines).eql(content.toString().split(EOL).concat(changes));
    });
    it('should fail to watch log file from start using legacy API, due to existing content read error', async function () {
        // given
        when(fileSystem.readFile(allowedLogs[0])).thenReject(new Error('error'));
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0], fromStart: true});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'Failed to read content of log file /var/log/messages.log. Reason: error'});
    });
    it('should watch log file using legacy API, starting from the latest content changes', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0]});
        // then
        const lines: Array<string> = await socket.messages.pipe(
            take(3),
            map(c => c.changes),
            mergeMap(v => v),
            toArray<string>()
        ).toPromise();
        expect(lines).eql(changes);
    });
    it('should fail to watch log file from the latest change using legacy API, due to an error', async function () {
        // given
        when(fileWatcher.watch(allowedLogs[0])).thenReturn(throwError(new Error('error')));
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0]});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'Failed to watch content changes in log file /var/log/messages.log. Reason: error'});
    });
    it('should fail to stop watching log file using legacy API, since the file is not specified', async function () {
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'unwatch'});
        // then
        expect(await socket.oneMessage).eql({type: 'error', message: 'file is required.'});
    });
    it('should stop watching log file using legacy API', async function () {
        // given
        const output: Subject<string> = new ReplaySubject<string>();
        when(fileWatcher.watch(allowedLogs[0])).thenReturn(output);
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0]});
        socket.receive({type: 'unwatch', file: allowedLogs[0]});
        output.next('line 6');
        await expect(socket.messages.pipe(take(1), timeout(1)).toPromise()).rejectedWith(TimeoutError);
    });
    it('should stop watching all previously watched log files using legacy API after connection closure', async function () {
        // given
        const output: Subject<string> = new ReplaySubject<string>();
        when(fileWatcher.watch(allowedLogs[0])).thenReturn(output);
        // when
        const socket: DummyWebSocket = await wss.connect('/');
        socket.receive({type: 'watch', file: allowedLogs[0]});
        socket.close(1, null);
        output.next('line 6');
        await expect(socket.messages.pipe(take(1), timeout(1)).toPromise()).rejectedWith(TimeoutError);
    });
});
