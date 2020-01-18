import {Collection, EntityNotFoundError} from "../../../app/common/collection/collection";
import {instance, mock, verify, when} from "ts-mockito";
import {expect} from "chai";
import * as chai from "chai";
import {Content} from "../../../app/log-watcher/log/content";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileFactory} from "../../../app/log-watcher/log/log-file-factory";
import {LogFileCantBeDisposedError, LogFilePool} from "../../../app/log-watcher/log/log-file-pool";
import chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

describe('LogFilePool', function () {
    const absoluteLogFilePath = '/var/log/messages';
    let content: Content;
    let logFile: LogFile;
    let logFiles: Collection<LogFile>;
    let factory: LogFileFactory;
    let pool: LogFilePool;
    beforeEach(function () {
        factory = mock<LogFileFactory>();
        logFiles = mock<Collection<LogFile>>();
        content = mock<Content>();
        logFile = new LogFile(absoluteLogFilePath, instance(content));
        when(factory.create(absoluteLogFilePath)).thenReturn(logFile);
        pool = new LogFilePool(instance(logFiles), instance(factory));
    });
    it('should create new instance of a log file, save it and return it', async function () {
        // given
        when(logFiles.contains(absoluteLogFilePath)).thenResolve(false);
        // when
        const actualLogFile: LogFile = await pool.getLog(absoluteLogFilePath);
        // then
        expect(actualLogFile).to.equal(logFile);
        verify(logFiles.add(logFile)).once();
    });
    it('should return existing instance of a log file', async function () {
        // given
        when(logFiles.contains(absoluteLogFilePath)).thenResolve(true);
        when(logFiles.findById(absoluteLogFilePath)).thenResolve(logFile);
        // when
        const actualLogFile: LogFile = await pool.getLog(absoluteLogFilePath);
        // then
        expect(actualLogFile).to.equal(logFile);
        verify(factory.create(absoluteLogFilePath)).never();
    });
    it('should dispose log file since it has no listeners', async function () {
        // given
        when(content.hasChangesListeners()).thenReturn(false);
        // when
        await pool.disposeIfNecessary(logFile);
        // then
        verify(content.close()).once();
        verify(logFiles.remove(logFile)).once();
    });
    it('should not try to dispose the log file since it still has listeners', async function () {
        // given
        when(content.hasChangesListeners()).thenReturn(true);
        // when
        await pool.disposeIfNecessary(logFile);
        // then
        verify(content.close()).never();
        verify(logFiles.remove(logFile)).never();
    });
    it('should fail to dispose a log file that does not belong to this pool', async function () {
        // given
        when(content.hasChangesListeners()).thenReturn(false);
        when(logFiles.remove(logFile)).thenReject(new EntityNotFoundError(logFile));
        // then
        await expect(pool.disposeIfNecessary(logFile)).to.be.rejectedWith(LogFileCantBeDisposedError);
        verify(content.close()).never();
    });
    it('should dispose those log files that dont have listeners', async function () {
        // given
        const anotherContent: Content = mock<Content>();
        when(content.hasChangesListeners()).thenReturn(false);
        when(anotherContent.hasChangesListeners()).thenReturn(true);
        const anotherLogFile: LogFile = new LogFile('/a/b/c/log-file.log', instance(anotherContent));
        // when
        await pool.disposeAllIfNecessary([logFile, anotherLogFile]);
        // then
        verify(logFiles.remove(logFile)).once();
        verify(content.close()).once();
        verify(logFiles.remove(anotherLogFile)).never();
        verify(anotherContent.close()).never();
    });
});