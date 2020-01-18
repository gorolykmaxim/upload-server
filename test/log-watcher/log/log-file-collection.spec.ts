import {expect} from "chai";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileComparison} from "../../../app/log-watcher/log/log-file-collection";
import {EntityComparison} from "../../../app/common/collection/in-memory-collection";

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