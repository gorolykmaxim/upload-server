import {
    FileNameMissingError,
    LegacyWebSocketAPI,
    UnknownMessageTypeError
} from "../../../app/log-watcher/api/legacy-web-socket-api";
import {LogFilePool, LogFilePoolError} from "../../../app/log-watcher/log/log-file-pool";
import {WatcherFactory} from "../../../app/log-watcher/watcher/watcher-factory";
import {anything, instance, mock, spy, verify, when} from "ts-mockito";
import {Content} from "../../../app/log-watcher/log/content";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {Watcher} from "../../../app/log-watcher/watcher/watcher";
import {expect} from "chai";
import WebSocket = require("ws");

describe('LegacyWebSocketAPI', function () {
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
    let legacyAPI: LegacyWebSocketAPI;
    let content: Content;
    let logFile: LogFile;
    let logFilePool: LogFilePool;
    let watcher: Watcher;
    let watcherFactory: WatcherFactory;
    let realConnection: WebSocket;
    let connection: WebSocket;
    beforeEach(function () {
        content = mock<Content>();
        logFilePool = mock(LogFilePool);
        const realWatcher = new Watcher(null, null, null, null);
        // Instead of making a simple mock of a watcher, we are spying on a real object:
        // ts-mockito mocks fail when their toString() gets called. toString() of the watcher would get called
        // multiple times throughout the test.
        watcher = spy(realWatcher);
        when(watcher.notifyAboutError(anything())).thenReturn();
        when(watcher.stopWatchingLogs()).thenResolve();
        when(watcher.stopWatchingLog(anything())).thenResolve();
        when(watcher.watchLog(anything())).thenResolve();
        when(watcher.watchFromTheBeginning(anything())).thenResolve();
        when(watcher.id).thenReturn("15");
        when(watcher.readFromTheBeginning(anything())).thenResolve();
        watcherFactory = mock(WatcherFactory);
        realConnection = new WebSocket(null);
        connection = spy(realConnection);
        logFile = new LogFile(absoluteLogFilePath, instance(content));
        when(logFilePool.getLog(absoluteLogFilePath)).thenResolve(logFile);
        when(watcher.stopWatchingLogs()).thenResolve([logFile]);
        when(watcherFactory.create(realConnection)).thenReturn(realWatcher);
        legacyAPI = new LegacyWebSocketAPI(instance(logFilePool), instance(watcherFactory));
        legacyAPI.process(realConnection, null);
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