import {StringBuffer} from "../../app/common/string-buffer";
import {EOL} from "os";
import { expect } from "chai";

describe('StringBuffer', function () {
    let buffer: StringBuffer;
    beforeEach(function () {
        buffer = new StringBuffer(EOL);
    });
    it('should return only complete lines', function () {
        // given
        const data = `line 1${EOL}line`;
        // when
        const lines = buffer.readLines(data);
        // then
        expect(lines).to.eql(['line 1']);
    });
    it('should complete the incomplete line during the second read', function () {
        // given
        const data = `line 1${EOL}line 2${EOL}`;
        // when
        const lines = buffer.readLines(data.substring(0, 9));
        lines.push(...buffer.readLines(data.substring(9, data.length)));
        // then
        expect(lines).to.eql(['line 1', 'line 2']);
    });
});