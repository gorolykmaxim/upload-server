import {URL} from "../../../../app/common/url";
import {Collection} from "../../../../app/common/collection/collection";
import {LogFile} from "../../../../app/log-watcher/log/log-file";
import {Request, Response} from "express";
import {LogFilePool} from "../../../../app/log-watcher/log/log-file-pool";
import {FileSystem} from "../../../../app/log-watcher/log/file-system";
import {anything, instance, mock, when} from "ts-mockito";
import {WatchableLog} from "../../../../app/log-watcher/api/rest/watchable-log";

export class Mocks {
    readonly baseURL: URL = URL.createNew('api').append('log-watcher');
    readonly logURL: URL = this.baseURL.append('log');
    readonly absoluteLogFilePath = '/var/log/messages';
    readonly expectedWatchableLog: WatchableLog = new WatchableLog(this.absoluteLogFilePath);
    readonly logFileMock: LogFile;
    readonly logFile: LogFile;
    readonly reqMock: Request;
    readonly req: Request;
    readonly resMock: Response;
    readonly res: Response;
    readonly allowedLogs: Collection<string>;
    readonly logFilePool: LogFilePool;
    readonly fileSystem: FileSystem;

    constructor() {
        this.logFileMock = mock(LogFile);
        this.logFile = instance(this.logFileMock);
        this.reqMock = mock<Request>();
        this.req = instance(this.reqMock);
        this.resMock = mock<Response>();
        this.res = instance(this.resMock);
        this.allowedLogs = mock<Collection<string>>();
        this.logFilePool = mock(LogFilePool);
        this.fileSystem = mock<FileSystem>();
        when(this.resMock.status(anything())).thenReturn(this.res);
        const body = {absolutePath: this.absoluteLogFilePath};
        when(this.reqMock.body).thenReturn(body);
        when(this.reqMock.query).thenReturn(body);
        when(this.logFilePool.getLog(this.absoluteLogFilePath)).thenResolve(this.logFile);
    }
}