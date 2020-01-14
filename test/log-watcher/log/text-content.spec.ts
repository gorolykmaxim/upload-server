import {EOL} from "os";
import {expect} from "chai";
import {TextContent} from "../../../app/log-watcher/log/text-content";

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