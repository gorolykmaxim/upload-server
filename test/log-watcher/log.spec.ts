import {
    Content,
    LogFile,
    LogFileAccessError,
    LogFileFactory,
    OnChange,
    RestrictedLogFileFactory
} from "../../app/log-watcher/log";
import {instance, mock, verify, when} from "ts-mockito";
import {expect} from "chai";

describe('LogFile', () => {
    const absolutePathToLogFile = '/a/b/c/file.log';
    let content: Content;
    let logFile: LogFile;
    beforeEach(function () {
        content = mock<Content>();
        logFile = new LogFile(absolutePathToLogFile, instance(content));
    });
    it('should set OnChange callback on its content', function () {
        // given
        const onChange: OnChange = () => {};
        // when
        logFile.addContentChangesListener(onChange);
        // then
        verify(content.addChangesListener(onChange)).once();
    });
    it('should remove OnChange callback from its content', function () {
        // given
        const onChange: OnChange = () => {};
        // when
        logFile.removeContentChangesListener(onChange);
        // then
        verify(content.removeChangesListener(onChange)).once();
    });
    it('should check if its content has change listeners', function () {
        // given
        when(content.hasChangesListeners()).thenReturn(true);
        // when
        const hasChangeListeners = logFile.hasContentChangesListeners();
        // then
        expect(hasChangeListeners).to.be.true;
    });
    it('should return promise of its content size', async function () {
        // given
        const expectedSize = 15;
        when(content.getSize()).thenReturn(Promise.resolve(expectedSize));
        // when
        const size = await logFile.getContentSize();
        // then
        expect(size).to.equal(expectedSize);
    });
    it('should return promise of its content as a string', async function () {
        // given
        const expectedContent = "log file entry";
        when(content.read()).thenReturn(Promise.resolve(expectedContent));
        // when
        const contentAsString = await logFile.getContentAsString();
        // then
        expect(contentAsString).to.equal(expectedContent);
    });
    it('should close its content', function () {
        // when
        logFile.close();
        // then
        verify(content.close()).once();
    });
});

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