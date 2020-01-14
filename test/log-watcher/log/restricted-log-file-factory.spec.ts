import {instance, mock, when} from "ts-mockito";
import {expect} from "chai";
import {LogFileFactory} from "../../../app/log-watcher/log/log-file-factory";
import {LogFileAccessError, RestrictedLogFileFactory} from "../../../app/log-watcher/log/restricted-log-file-factory";
import {LogFile} from "../../../app/log-watcher/log/log-file";

describe('RestrictedLogFileFactory', () => {
    const allowedLogFilePaths = ['/a/b/c/file.log'];
    let delegateFactory: LogFileFactory;
    let factory: LogFileFactory;
    beforeEach(function () {
        delegateFactory = mock<LogFileFactory>();
        factory = new RestrictedLogFileFactory(instance(delegateFactory), new Set<string>(allowedLogFilePaths));
    });
    it('should not create log file, access to which is restricted', function () {
        // then
        expect(() => factory.create('/restricted/access.log')).to.throw(LogFileAccessError);
    });
    it('should create a log file using specified delegate factory', function () {
        // given
        const absoluteLogFilePath = allowedLogFilePaths[0];
        const expectedLogFile: LogFile = new LogFile(absoluteLogFilePath, null);
        when(delegateFactory.create(absoluteLogFilePath)).thenReturn(expectedLogFile);
        // when
        const logFile: LogFile = factory.create(absoluteLogFilePath);
        // then
        expect(logFile).to.equal(expectedLogFile);
    });
});