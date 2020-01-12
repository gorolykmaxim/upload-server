import {
    CantWatchLogMultipleTimesError,
    DefaultMessageFactory,
    LegacyMessageFactory,
    MessageFactory, Watcher,
    WatcherFactory, WatcherIsNotWatchingLogFileError
} from "../../app/log-watcher/watcher";
import {Content, ContentReadError, LogFile, TextContent} from "../../app/log-watcher/log";
import { expect } from "chai";
import WebSocket = require("ws");
import {anyFunction, anything, capture, instance, mock, resetCalls, verify, when} from "ts-mockito";
import uuid = require("uuid");
import * as chai from "chai";
import chaiAsPromised = require("chai-as-promised");
import {EOL} from "os";

chai.use(chaiAsPromised);

describe('Watcher', function () {
    const id = uuid();
    let connection: WebSocket;
    const textContent = new TextContent(`line1${EOL}line2`, EOL);
    let content: Content;
    let logFile: LogFile;
    const messageFactory = new DefaultMessageFactory();
    const factory = new WatcherFactory(() => id, messageFactory);
    let watcher: Watcher;
    beforeEach(function () {
        connection = mock(WebSocket);
        content = mock<Content>();
        when(content.readText()).thenResolve(textContent);
        logFile = new LogFile('/a/b/c/file.log', instance(content));
        watcher = factory.create(instance(connection));
    });
    it('should watch changes in a log file and notify API client about them', async function () {
        // given
        const expectedLine = 'line';
        // when
        await watcher.watchLog(logFile);
        const [listener] = capture(content.addChangesListener).last();
        listener(expectedLine);
        // then
        verify(connection.send(messageFactory.createLogChangeMessage(logFile, [expectedLine]))).once();
    });
    it('should not watch the same log file twice', async function () {
        // when
        await watcher.watchLog(logFile);
        // then
        await expect(watcher.watchLog(logFile)).to.be.rejectedWith(CantWatchLogMultipleTimesError);
    });
    it('should read log file from the beginning', async function () {
        // when
        await watcher.readFromTheBeginning(logFile);
        // then
        verify(connection.send(messageFactory.createLogChangeMessage(logFile, textContent.getLines()))).once();
    });
    it('should fail to read log file from the beginning and notify API client about it', async function () {
        // given
        const expectedError = new ContentReadError(logFile.absolutePath, new Error());
        when(content.readText()).thenReject(expectedError);
        // then
        await expect(watcher.readFromTheBeginning(logFile)).to.be.rejectedWith(ContentReadError);
        verify(connection.send(messageFactory.createErrorMessage(expectedError))).once();
    });
    it('should not try to notify API client about a failed attempt to notify API client', async function () {
        // given
        const expectedError = new Error();
        when(connection.send(anything())).thenThrow(expectedError);
        // then
        await expect(watcher.readFromTheBeginning(logFile)).to.be.rejectedWith(Error);
        verify(connection.send(messageFactory.createErrorMessage(expectedError))).never();
    });
    it('should watch log file from the beginning', async function () {
        // given
        const expectedLine = 'line 3';
        // when
        await watcher.watchFromTheBeginning(logFile);
        const [listener] = capture(content.addChangesListener).last();
        listener(expectedLine);
        // then
        const existingLogContentRead = connection.send(messageFactory.createLogChangeMessage(logFile, textContent.getLines()));
        const newLogContentRead = connection.send(messageFactory.createLogChangeMessage(logFile, [expectedLine]));
        verify(existingLogContentRead).calledBefore(newLogContentRead);
        verify(newLogContentRead).calledAfter(existingLogContentRead);
    });
    it('should not try to read log file from the beginning if it has failed to start watching it', async function () {
        // when
        await watcher.watchLog(logFile);
        // then
        await expect(watcher.watchFromTheBeginning(logFile)).to.be.rejectedWith(CantWatchLogMultipleTimesError);
        verify(content.readText()).never();
    });
    it('should stop watching changes in a log file', async function () {
        // given
        await watcher.watchLog(logFile);
        // when
        await watcher.stopWatchingLog(logFile);
        // then
        verify(content.removeChangesListener(anyFunction())).once();
    });
    it('should fail to stop watching a log file that is not being watched by it', async function () {
        // given
        const expectedError = new WatcherIsNotWatchingLogFileError(watcher, logFile);
        // then
        await expect(watcher.stopWatchingLog(logFile)).to.be.rejectedWith(WatcherIsNotWatchingLogFileError);
        verify(connection.send(messageFactory.createErrorMessage(expectedError)))
    });
    it('should be able to watch changes in a log file again after stopping doing so', async function () {
        // given
        await watcher.watchLog(logFile);
        resetCalls(content);
        // when
        await watcher.stopWatchingLog(logFile);
        await watcher.watchLog(logFile);
        // then
        verify(content.addChangesListener(anyFunction())).once();
    });
});

describe('LegacyMessageFactory', function () {
    const logFile = new LogFile('/a/b/c/log-file.log', null);
    const factory: MessageFactory = new LegacyMessageFactory();
    it('should create message about changes', function () {
        // given
        const changes = ['line 1', 'line 2'];
        // when
        const message = factory.createLogChangeMessage(logFile, changes);
        // then
        expect(message).to.equal(JSON.stringify({type: 'change', file: logFile.absolutePath, changes: changes}));
    });
    it('should create message about an error', function () {
        // given
        const error = new Error('Some error has happened');
        // when
        const message = factory.createErrorMessage(error);
        // then
        expect(message).to.equal(JSON.stringify({type: 'error', message: error.message}));
    });
});

describe('DefaultMessageFactory', function () {
    const logFile = new LogFile('/a/b/c/log-file.log', null);
    const factory: MessageFactory = new DefaultMessageFactory();
    it('should create message about changes', function () {
        // given
        const changes = ['line 1', 'line 2'];
        // when
        const message = factory.createLogChangeMessage(logFile, changes);
        // then
        expect(message).to.equal(JSON.stringify({type: 'change', changes: changes}));
    });
    it('should create message about an error', function () {
        // given
        const error = new Error('Some error has happened');
        // when
        const message = factory.createErrorMessage(error);
        // then
        expect(message).to.equal(JSON.stringify({type: 'error', message: error.message}));
    });
});