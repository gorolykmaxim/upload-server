import {FileNameMissingError, LegacyAPI, UnknownMessageTypeError} from "../../../app/log-watcher/api/legacy-api";
import {Collection} from "../../../app/collection/collection";
import {LogFilePool, LogFilePoolError} from "../../../app/log-watcher/log/log-file-pool";
import {WatcherFactory} from "../../../app/log-watcher/watcher/watcher-factory";
import {Server} from "ws";
import {anything, instance, mock, spy, verify, when} from "ts-mockito";
import {Content} from "../../../app/log-watcher/log/content";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {Watcher} from "../../../app/log-watcher/watcher/watcher";
import {LogFileAccessError} from "../../../app/log-watcher/log/restricted-log-file-factory";
import {expect} from "chai";
import WebSocket = require("ws");

describe('LegacyAPI', function () {
    const absoluteLogFilePath = '/a/b/c/access.log';
    const watchMessage = {
        type: 'watch',
        file: absoluteLogFilePath
    };
    const watchMessageFromStart = Object.assign({fromStart: true}, watchMessage);
    const unwatchMessage = {
        type: 'unwatch',
        file: absoluteLogFilePath
    };
    let legacyAPI: LegacyAPI;
    let allowedLogFiles: Collection<string>;
    let content: Content;
    let logFile: LogFile;
    let logFilePool: LogFilePool;
    let watcher: Watcher;
    let watcherFactory: WatcherFactory;
    let realConnection: WebSocket;
    let connection: WebSocket;
    let server: Server;
    beforeEach(function () {
        allowedLogFiles = mock<Collection<string>>();
        content = mock<Content>();
        logFilePool = mock(LogFilePool);
        watcher = mock(Watcher);
        watcherFactory = mock(WatcherFactory);
        realConnection = new WebSocket(null);
        connection = spy(realConnection);
        server = new Server({noServer: true});
        logFile = new LogFile(absoluteLogFilePath, instance(content));
        when(allowedLogFiles.contains(absoluteLogFilePath)).thenResolve(true);
        when(logFilePool.getLog(absoluteLogFilePath)).thenResolve(logFile);
        when(watcher.stopWatchingLogs()).thenResolve([logFile]);
        when(watcherFactory.create(realConnection)).thenReturn(instance(watcher));
        legacyAPI = new LegacyAPI(instance(allowedLogFiles), instance(logFilePool), instance(watcherFactory), server);
        server.emit('connection', realConnection);
    });
    it('should start watching log file changes', function (done) {
        // given
        when(watcher.watchLog(logFile)).thenCall(_ => done());
        // when
        realConnection.emit('message', JSON.stringify(watchMessage));
    });
    it('should start watching log file changes from the beginning',  function (done) {
        // given
        when(watcher.watchFromTheBeginning(logFile)).thenCall(_ => done());
        // when
        realConnection.emit('message', JSON.stringify(watchMessageFromStart));
    });
    it('should forbid watching changes in a restricted log file', function (done) {
        // given
        when(allowedLogFiles.contains(absoluteLogFilePath)).thenResolve(false);
        when(watcher.notifyAboutError(anything())).thenCall((e: Error) => {
            expect(e.message).to.equal(new LogFileAccessError(absoluteLogFilePath).message);
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify(watchMessage));
    });
    it('should notify watcher about a failed attempt to start watching changes in a log file', function (done) {
        // given
        const expectedError = new LogFilePoolError("Something terrible happened");
        when(logFilePool.getLog(absoluteLogFilePath)).thenReject(expectedError);
        when(watcher.notifyAboutError(anything())).thenCall((e: Error) => {
            expect(e.message).to.equal(expectedError.message);
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify(watchMessage));
    });
    it('should stop watching log file changes', function (done) {
        // given
        when(logFilePool.disposeIfNecessary(logFile)).thenCall(_ => {
            verify(watcher.stopWatchingLog(logFile)).once();
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify(unwatchMessage));
    });
    it('should notify watcher about a failed attempt to stop watching log file changes',  function (done) {
        // given
        const expectedError = new LogFilePoolError("Something weird has happened");
        when(logFilePool.disposeIfNecessary(logFile)).thenReject(expectedError);
        when(watcher.notifyAboutError(anything())).thenCall((e: Error) => {
            verify(watcher.stopWatchingLog(logFile)).once();
            expect(e.message).to.equal(expectedError.message);
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify(unwatchMessage));
    });
    it('should make watcher stop watching all of its log files and dispose the files on connection closure if necessary', function (done) {
        // given
        when(logFilePool.disposeAllIfNecessary(anything())).thenCall((logFiles: Array<LogFile>) => {
            expect(logFiles).to.eql([logFile]);
            verify(watcher.stopWatchingLogs()).once();
            done();
        });
        // when
        realConnection.emit('close');
    });
    it('should notify watcher about an incorrect message type', function (done) {
        // given
        const type = 'listen';
        const message = {type: type, file: absoluteLogFilePath};
        when(watcher.notifyAboutError(anything())).thenCall((e: Error) => {
            expect(e.message).to.equal(new UnknownMessageTypeError(type).message);
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify(message));
    });
    it('should tell watcher that a "file" attribute is mandatory', function (done) {
        // given
        when(watcher.notifyAboutError(anything())).thenCall((e: Error) => {
            expect(e.message).to.equal(new FileNameMissingError().message);
            done();
        });
        // when
        realConnection.emit('message', JSON.stringify({}));
    });
});