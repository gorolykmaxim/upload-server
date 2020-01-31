import {Watcher} from "../../../app/log-watcher/watcher/watcher";
import {WatcherFactory} from "../../../app/log-watcher/watcher/watcher-factory";
import {LogFilePool} from "../../../app/log-watcher/log/log-file-pool";
import {anything, capture, instance, mock, spy, verify, when} from "ts-mockito";
import {DefaultWebSocketAPI} from "../../../app/log-watcher/api/default-web-socket-api";
import {ArgumentError} from "common-errors";
import {expect} from "chai";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileAccessError} from "../../../app/log-watcher/log/restricted-log-file-pool";
import WebSocket = require("ws");
import {Request} from "express";

describe('DefaultWebSocketAPI', function () {
    const absoluteLogFilePath: string = '/var/log/messages';
    let connection: WebSocket;
    let connectionSpy: WebSocket;
    let requestMock: Request;
    let request: Request;
    let watcher: Watcher;
    let watcherSpy: Watcher;
    let factory: WatcherFactory;
    let logFileMock: LogFile;
    let logFile: LogFile;
    let pool: LogFilePool;
    let api: DefaultWebSocketAPI;
    beforeEach(function () {
        connection = new WebSocket(null);
        connectionSpy = spy(connection);
        when(connectionSpy.close(anything(), anything())).thenCall(() => {});
        requestMock = mock<Request>();
        request = instance(requestMock);
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
        when(requestMock.query).thenReturn({absolutePath: absoluteLogFilePath});
        when(pool.getLog(absoluteLogFilePath)).thenResolve(logFile);
        when(factory.create(connection)).thenReturn(watcher);
        api = new DefaultWebSocketAPI(instance(pool), instance(factory));
    });
    it('should fail to start watching a log file due to missing "absolutePath" parameter', async function () {
        // given
        when(requestMock.query).thenReturn({});
        // when
        await api.process(connection, request);
        // then
        const [error] = capture(watcherSpy.notifyAboutError).last();
        expect(error.message).to.equal(new ArgumentError('absolutePath').message);
    });
    it('should notify incoming connection about the changes in the specified log file', async function () {
        // when
        await api.process(connection, request);
        // then
        verify(watcherSpy.watchLog(logFile)).once();
    });
    it('should send existing contents of a the specified log file to the connection and then notify connection about changes in the file', async function () {
        // given
        request.query.fromStart = true;
        // when
        await api.process(connection, request);
        // then
        verify(watcherSpy.watchFromTheBeginning(logFile)).once();
    });
    it('should immediately close a connection, that attempted to watches changes in a forbidden log file', async function () {
        // given
        const expectedError = new LogFileAccessError(absoluteLogFilePath);
        when(pool.getLog(absoluteLogFilePath)).thenReject(expectedError);
        // when
        await api.process(connection, request);
        // then
        verify(connectionSpy.close(1008, expectedError.message)).once();
        verify(watcherSpy.notifyAboutError(expectedError)).never();
    });
    it('should notify watcher about a failed attempt to watch for changes in a log file', async function () {
        // given
        const expectedError = new Error();
        when(pool.getLog(absoluteLogFilePath)).thenReject(expectedError);
        // when
        await api.process(connection, request);
        // then
        verify(watcherSpy.notifyAboutError(expectedError)).once();
    });
    it('should stop watching all the log files, watched by the connection, that is closing, and dispose them if nobody else watches them', async function () {
        // given
        const freedLogFiles: Array<LogFile> = [logFile];
        when(watcherSpy.stopWatchingLogs()).thenResolve(freedLogFiles);
        await api.process(connection, request);
        const closeConnection: Function = capture(connectionSpy.on).last()[1];
        // when
        await closeConnection();
        // then
        verify(pool.disposeAllIfNecessary(freedLogFiles)).once();
    });
});