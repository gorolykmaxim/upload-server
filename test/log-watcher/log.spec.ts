import {
    Content,
    LogFile,
    LogFileAccessError,
    LogFileComparison,
    LogFileFactory,
    OnChange,
    RestrictedLogFileFactory,
    TextContent
} from "../../app/log-watcher/log";
import {instance, mock, verify, when} from "ts-mockito";
import * as chai from "chai";
import {expect} from "chai";
import * as chaiAsPromised from "chai-as-promised";
import {EntityComparison} from "../../app/collection";
import {EOL} from "os";

chai.use(chaiAsPromised);

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
        const expectedContent = new TextContent("log file entry", EOL);
        when(content.readText()).thenResolve(expectedContent);
        // when
        const contentAsString = await logFile.getContentAsString();
        // then
        expect(contentAsString).to.equal(expectedContent.content);
    });
    it('should return promise of its content as a text', async function () {
        // given
        const expectedContent = new TextContent(`line1${EOL}line2`, EOL);
        when(content.readText()).thenResolve(expectedContent);
        // when
        const lines = await logFile.getContentLines();
        // then
        expect(lines).to.eql(expectedContent.getLines());
    });
    it('should close its content', function () {
        // when
        logFile.close();
        // then
        verify(content.close()).once();
    });
});

describe('TextContent', function () {
    it('should return content', function () {
        // given
        const content = 'content of the file';
        // when
        const textContent = new TextContent(content, EOL);
        // then
        expect(textContent.content).to.equal(content);
    });
    it('should return content in lines, while truncating the last empty line', function () {
        // given
        const content = `line1${EOL}line2${EOL}`;
        // when
        const lines = new TextContent(content, EOL).getLines();
        // then
        expect(lines).to.eql(['line1', 'line2']);
    });
    it('should return content in lines', function () {
        // given
        const content = `line1${EOL}line2`;
        // when
        const lines = new TextContent(content, EOL).getLines();
        // then
        expect(lines).to.eql(['line1', 'line2']);
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

describe('LogFileComparison', function () {
    const comparison: EntityComparison<LogFile> = new LogFileComparison();
    const logFile1: LogFile = new LogFile('/a/b/c/access.log', null);
    const logFile2: LogFile = new LogFile('/a/b/c/error.log', null);
    it('should return true since both log files have the same absolute path', function () {
        // then
        expect(comparison.equal(logFile1, logFile1)).to.be.true;
    });
    it('should return false since log files have different absolute paths', function () {
        // then
        expect(comparison.equal(logFile2, logFile1)).to.be.false;
    });
    it('should return true since the log file has specified absolute path', function () {
        // then
        expect(comparison.hasId(logFile1, logFile1.absolutePath)).to.be.true;
    });
    it('should return false since the log file has a different absolute path', function () {
        // then
        expect(comparison.hasId(logFile1, logFile2.absolutePath)).to.be.false;
    });
});