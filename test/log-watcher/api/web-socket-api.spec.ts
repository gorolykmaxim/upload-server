import {Watcher} from "../../../app/log-watcher/watcher/watcher";
import {WatcherFactory} from "../../../app/log-watcher/watcher/watcher-factory";
import {LogFilePool} from "../../../app/log-watcher/log/log-file-pool";
import WebSocket = require("ws");
import {anything, capture, instance, mock, spy, verify, when} from "ts-mockito";
import {WebSocketAPI} from "../../../app/log-watcher/api/web-socket-api";
import {Server} from "ws";
import {ArgumentError} from "common-errors";
import { expect } from "chai";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileAccessError} from "../../../app/log-watcher/log/restricted-log-file-pool";

describe('WebSocketAPI', function () {
    const absoluteLogFilePath: string = '/var/log/messages';
    const url: string = `ws://localhost:8090/api/log-watcher/log?absolutePath=${absoluteLogFilePath}`;
    let connection: WebSocket;
    let connectionSpy: WebSocket;
    let server: Server;
    let watcher: Watcher;
    let watcherSpy: Watcher;
    let factory: WatcherFactory;
    let logFileMock: LogFile;
    let logFile: LogFile;
    let pool: LogFilePool;
    let openConnection: Function;
    beforeEach(function () {
        connection = new WebSocket(null);
        connectionSpy = spy(connection);
        server = mock(Server);
        watcher = new Watcher(null, null, null, null);
        watcherSpy = spy(watcher);
        when(watcherSpy.notifyAboutError(anything())).thenResolve();
        when(watcherSpy.watchLog(anything())).thenResolve();
        when(watcherSpy.watchFromTheBeginning(anything())).thenResolve();
        when(watcherSpy.stopWatchingLogs()).thenResolve();
        factory = mock(WatcherFactory);
        logFileMock = mock(LogFile);
        logFile = instance(logFileMock);
        pool = mock(LogFilePool);
        when(pool.getLog(absoluteLogFilePath)).thenResolve(logFile);
        when(connectionSpy.url).thenReturn(url);
        when(factory.create(connection)).thenReturn(watcher);
        const api: WebSocketAPI = new WebSocketAPI(instance(pool), instance(factory), instance(server));
        openConnection = capture(server.on).last()[1];
    });
    it('should fail to start watching a log file due to missing "absolutePath" parameter', async function () {
        // given
        when(connectionSpy.url).thenReturn('ws://localhost:8090/api/log-watcher/log');
        // when
        await openConnection(connection);
        // then
        const [error] = capture(watcherSpy.notifyAboutError).last();
        expect(error.message).to.equal(new ArgumentError('absolutePath').message);
    });
    it('should notify incoming connection about the changes in the specified log file', async function () {
        // when
        await openConnection(connection);
        // then
        verify(watcherSpy.watchLog(logFile)).once();
    });
    it('should send existing contents of a the specified log file to the connection and then notify connection about changes in the file', async function () {
        // given
        when(connectionSpy.url).thenReturn(`${url}&fromStart=true`);
        // when
        await openConnection(connection);
        // then
        verify(watcherSpy.watchFromTheBeginning(logFile)).once();
    });
    it('should notify watched about a failed attempt to start listening to changes in the specified log file', async function () {
        // given
        const expectedError = new LogFileAccessError(absoluteLogFilePath);
        when(pool.getLog(absoluteLogFilePath)).thenReject(expectedError);
        // when
        await openConnection(connection);
        // then
        verify(watcherSpy.notifyAboutError(expectedError)).once();
    });
    it('should stop watching all the log files, watched by the connection, that is closing, and dispose them if nobody else watches them', async function () {
        // given
        const freedLogFiles: Array<LogFile> = [logFile];
        when(watcherSpy.stopWatchingLogs()).thenResolve(freedLogFiles);
        await openConnection(connection);
        const closeConnection: Function = capture(connectionSpy.on).last()[1];
        // when
        await closeConnection();
        // then
        verify(pool.disposeAllIfNecessary(freedLogFiles)).once();
    });
});