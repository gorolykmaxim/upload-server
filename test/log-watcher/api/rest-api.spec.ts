import {URL} from "../../../app/common/url";
import {Application, Request, RequestHandler, Response} from "express";
import {Collection, EntityNotFoundError} from "../../../app/common/collection/collection";
import {LogFilePool} from "../../../app/log-watcher/log/log-file-pool";
import {FileSystem} from "../../../app/log-watcher/log/file-system";
import {anything, capture, instance, mock, verify, when} from "ts-mockito";
import {APIError, RestAPI, WatchableLog} from "../../../app/log-watcher/api/rest-api";
import {ArgumentError} from "common-errors";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileAccessError} from "../../../app/log-watcher/log/restricted-log-file-pool";
import {expect} from "chai";

describe('RestAPI', function () {
    const baseURL: URL = URL.createNew('api').append('log-watcher');
    const logURL: URL = baseURL.append('log');
    const absoluteLogFilePath = '/var/log/messages';
    const expectedWatchableLog: WatchableLog = new WatchableLog(absoluteLogFilePath, logURL, logURL.append('size'), logURL.append('content'));
    const expectedInternalError = new Error();
    const expectedArgumentError = new ArgumentError('absolutePath');
    const expectedEntityNotFoundError = new EntityNotFoundError(absoluteLogFilePath);
    const expectedLogFileAccessError = new LogFileAccessError(absoluteLogFilePath);
    let logFileMock: LogFile;
    let logFile: LogFile;
    let reqMock: Request;
    let req: Request;
    let resMock: Response;
    let res: Response;
    let findAllLogs: RequestHandler;
    let getLogSize: RequestHandler;
    let getLogContent: RequestHandler;
    let allowLog: RequestHandler;
    let disallowLog: RequestHandler;
    let application: Application;
    let allowedLogs: Collection<string>;
    let logFilePool: LogFilePool;
    let fileSystem: FileSystem;
    let api: RestAPI;
    beforeEach(function () {
        logFileMock = mock(LogFile);
        logFile = instance(logFileMock);
        reqMock = mock<Request>();
        req = instance(reqMock);
        resMock = mock<Response>();
        res = instance(resMock);
        application = mock<Application>();
        allowedLogs = mock<Collection<string>>();
        logFilePool = mock(LogFilePool);
        fileSystem = mock<FileSystem>();
        when(resMock.status(anything())).thenReturn(res);
        const body = {absolutePath: absoluteLogFilePath};
        when(reqMock.body).thenReturn(body);
        when(reqMock.query).thenReturn(body);
        when(logFilePool.getLog(absoluteLogFilePath)).thenResolve(logFile);
        api = new RestAPI(baseURL, instance(application), instance(allowedLogs), instance(logFilePool), instance(fileSystem));
        findAllLogs = capture(application.get).byCallIndex(0)[1];
        getLogSize = capture(application.get).byCallIndex(1)[1];
        getLogContent = capture(application.get).byCallIndex(2)[1];
        allowLog = capture(application.post).byCallIndex(0)[1];
        disallowLog = capture(application.delete).byCallIndex(0)[1];
    });
    it('should listen to find allowed logs requests on the correct URL', function () {
        // then
        verify(application.get(logURL.value, findAllLogs)).once();
    });
    it('should listen to add allowed log requests on the correct URL', function () {
        // then
        verify(application.post(logURL.value, allowLog)).once();
    });
    it('should listen to remove allowed log requests on the correct URL', function () {
        // then
        verify(application.delete(logURL.value, disallowLog)).once();
    });
    it('should listen to get log size requests on the correct URL', function () {
        // then
        verify(application.get(logURL.append('size').value, getLogSize)).once();
    });
    it('should listen to get log content requests on the correct URL', function () {
        // then
        verify(application.get(logURL.append('content').value, getLogContent)).once();
    });
    it('should find all log files, that are allowed to be watched', async function () {
        // given
        when(allowedLogs.findAll()).thenResolve([absoluteLogFilePath]);
        // when
        await findAllLogs(req, res, null);
        // then
        verify(resMock.end(JSON.stringify([expectedWatchableLog]))).once();
    });
    it('should fail to find all watchable log files due to internal error', async function () {
        // given
        when(allowedLogs.findAll()).thenReject(expectedInternalError);
        // when
        await findAllLogs(req, res, null);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.allowedLogsLookup(expectedInternalError).message));
    });
    it('should fail to allow watching a log file due to missing "absolutePath" argument', async function () {
        // given
        when(reqMock.body).thenReturn({});
        // when
        await allowLog(req, res, null);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.allowedLogAddition(undefined, expectedArgumentError).message)).once();
    });
    it('should allow watching a log file', async function () {
        // given
        when(allowedLogs.contains(absoluteLogFilePath)).thenResolve(false);
        // when
        await allowLog(req, res, null);
        // then
        verify(allowedLogs.add(absoluteLogFilePath)).once();
        verify(resMock.end(JSON.stringify(expectedWatchableLog))).once();
    });
    it('should not add the same log file to the list of allowed log files twice, but should not fail the request either', async function () {
        // given
        when(allowedLogs.contains(absoluteLogFilePath)).thenResolve(true);
        // when
        await allowLog(req, res, null);
        // then
        verify(allowedLogs.add(absoluteLogFilePath)).never();
        verify(resMock.end(JSON.stringify(expectedWatchableLog))).once();
    });
    it('should notify client about the fact that the allowed log file does not exist', async function () {
        // given
        const expectedNotice = 'At this moment the log either does not exist or is inaccessible.';
        when(allowedLogs.contains(absoluteLogFilePath)).thenResolve(false);
        when(fileSystem.accessAsync(absoluteLogFilePath)).thenReject(new Error());
        // when
        await allowLog(req, res, null);
        // then
        verify(resMock.end(JSON.stringify(Object.assign({notice: expectedNotice}, expectedWatchableLog)))).once();
    });
    it('should fail to allow watching a log file due to internal error', async function () {
        // given
        when(allowedLogs.contains(absoluteLogFilePath)).thenReject(expectedInternalError);
        // when
        await allowLog(req, res, null);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.allowedLogAddition(absoluteLogFilePath, expectedInternalError).message)).once();
    });
    it('should fail to disallow watching a log file due to missing "absolutePath" argument', async function () {
        // given
        when(reqMock.query).thenReturn({});
        // when
        await disallowLog(req, res, null);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.allowedLogRemoval(undefined, expectedArgumentError).message)).once();
    });
    it('should disallow watching a log file', async function () {
        // when
        await disallowLog(req, res, null);
        // then
        verify(allowedLogs.remove(absoluteLogFilePath)).once();
        verify(resMock.end()).once();
    });
    it('should fail to disallow watching a log file, since the log file is already not allowed to be watched', async function () {
        // given
        when(allowedLogs.remove(absoluteLogFilePath)).thenReject(expectedEntityNotFoundError);
        // when
        await disallowLog(req, res, null);
        // then
        verify(resMock.status(404)).once();
        verify(resMock.end(APIError.allowedLogRemoval(absoluteLogFilePath, expectedEntityNotFoundError).message)).once();
    });
    it('should fail to disallow watching a log file due to internal error', async function () {
        // given
        when(allowedLogs.remove(absoluteLogFilePath)).thenReject(expectedInternalError);
        // when
        await disallowLog(req, res, null);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.allowedLogRemoval(absoluteLogFilePath, expectedInternalError).message)).once();
    });
    it('should fail to read the size of a log file due to missing "absolutePath" argument', async function () {
        // given
        when(reqMock.query).thenReturn({});
        // when
        await getLogSize(req, res, null);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.logSize(undefined, expectedArgumentError).message)).once();
    });
    it('should obtain log file from pool, read its size, dispose log file in pool and return its size', async function () {
        // given
        const expectedSize = 15;
        when(logFileMock.getContentSize()).thenResolve(expectedSize);
        // when
        await getLogSize(req, res, null);
        // then
        verify(logFilePool.disposeIfNecessary(logFile)).once();
        verify(resMock.end(JSON.stringify({sizeInBytes: expectedSize}))).once();
    });
    it('should fail to read the size of a log file, since the log file is not allowed to be watched', async function () {
        // given
        when(logFilePool.getLog(absoluteLogFilePath)).thenReject(expectedLogFileAccessError);
        // when
        await getLogSize(req, res, null);
        // then
        verify(resMock.status(403)).once();
        verify(resMock.end(APIError.logSize(absoluteLogFilePath, expectedLogFileAccessError).message)).once();
    });
    it('should fail to read the size of a log file due to internal error and still dispose the log file', async function () {
        // given
        when(logFileMock.getContentSize()).thenReject(expectedInternalError);
        // when
        await getLogSize(req, res, null);
        // then
        verify(logFilePool.disposeIfNecessary(logFile)).once();
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.logSize(absoluteLogFilePath, expectedInternalError).message)).once();
    });
    it('should fail to read content of a log file due to missing "absolutePath" argument', async function () {
        // given
        when(reqMock.query).thenReturn({});
        // when
        await getLogContent(req, res, null);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(APIError.logContent(undefined, expectedArgumentError).message)).once();
    });
    it('should obtain log file from pool, read its content, while splitting it in lines, dispose log file in pool and return its content', async function () {
        // given
        const expectedContent = ['log entry 1', 'log entry 2'];
        when(logFileMock.getContentLines()).thenResolve(expectedContent);
        // when
        await getLogContent(req, res, null);
        // then
        verify(logFilePool.disposeIfNecessary(logFile)).once();
        verify(resMock.end(JSON.stringify({content: expectedContent}))).once();
    });
    it('should obtain log file from pool, read its content, while not splitting it in lines, dispose log file in pool and return its content', async function () {
        // given
        const expectedContent = 'log entry1\nlog entry 2';
        req.query.noSplit = true;
        when(logFileMock.getContentAsString()).thenResolve(expectedContent);
        // when
        await getLogContent(req, res, null);
        // then
        verify(logFilePool.disposeIfNecessary(logFile)).once();
        verify(resMock.end(JSON.stringify({content: expectedContent}))).once();
    });
    it('should fail to read content of a log file, since the log file is not allowed to be watched', async function () {
        // given
        when(logFilePool.getLog(absoluteLogFilePath)).thenReject(expectedLogFileAccessError);
        // when
        await getLogContent(req, res, null);
        // then
        verify(resMock.status(403)).once();
        verify(resMock.end(APIError.logContent(absoluteLogFilePath, expectedLogFileAccessError).message)).once();
    });
    it('should fail to read content of a log file due to internal error', async function () {
        // given
        when(logFileMock.getContentLines()).thenReject(expectedInternalError);
        // when
        await getLogContent(req, res, null);
        // then
        verify(logFilePool.disposeIfNecessary(logFile)).once();
        verify(resMock.status(500)).once();
        verify(resMock.end(APIError.logContent(absoluteLogFilePath, expectedInternalError).message)).once();
    });
});

describe('WatchableLog', function () {
    const absolutePath = '/var/log/messages';
    const logURL: URL = URL.createNew("api").append('log-watcher').append('log');
    const logSizeURL: URL = logURL.append('size');
    const logContentURL: URL = logURL.append('content');
    const log: WatchableLog = new WatchableLog(absolutePath, logURL, logSizeURL, logContentURL);
    it('should create watchable log with the specified absolute path', function () {
        // then
        expect(log.absolutePath).to.equal(absolutePath);
    });
    it('should create watchable log with a ready-to-use "watch" link', function () {
        // then
        expect(log.webSocketLinks.watch).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "watchFromBeginning" link', function () {
        // then
        expect(log.webSocketLinks.watchFromBeginning).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}&fromStart=true`);
    });
    it('should create watchable log with a ready-to-use "remove" link', function () {
        // then
        expect(log.httpLinks.remove).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "getSize" link', function () {
        // then
        expect(log.httpLinks.getSize).to.equal(`/api/log-watcher/log/size?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "getContent" link', function () {
        // then
        expect(log.httpLinks.getContent).to.equal(`/api/log-watcher/log/content?absolutePath=${absolutePath}`);
    });
});