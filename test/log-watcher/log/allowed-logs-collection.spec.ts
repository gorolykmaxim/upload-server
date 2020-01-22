import {AbsoluteLogFilePathMapping} from "../../../app/log-watcher/log/allowed-logs-collection";
import { expect } from "chai";

describe('AbsoluteLogFilePathMapping', function () {
    const absolutePath: string = '/var/log/messages';
    const mapping: AbsoluteLogFilePathMapping = new AbsoluteLogFilePathMapping();
    it('should deserialize absolute log file path', function () {
        // when
        const path: string = mapping.deserialize({'ABSOLUTE_LOG_FILE_PATH': absolutePath});
        // then
        expect(path).to.equal(absolutePath);
    });
    it('should serialize absolute log file path', function () {
        // when
        const object: any = mapping.serialize(absolutePath);
        // then
        expect(object).to.eql({
            'ABSOLUTE_LOG_FILE_PATH': absolutePath
        });
    });
});