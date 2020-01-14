import {instance, mock, verify, when} from "ts-mockito";
import {expect} from "chai";
import {EOL} from "os";
import {TextContent} from "../../../app/log-watcher/log/text-content";
import {Content, OnChange} from "../../../app/log-watcher/log/content";
import {LogFile} from "../../../app/log-watcher/log/log-file";

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