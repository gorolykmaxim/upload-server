import {EntityComparison} from "../../../app/common/collection/in-memory-collection";
import {WatchedLogFile} from "../../../app/log-watcher/watcher/watched-log-file";
import {WatchedLogFileComparison} from "../../../app/log-watcher/watcher/watched-log-file-collection";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import { expect } from "chai";

describe('WatchedLogFileComparison', function () {
    const comparison: EntityComparison<WatchedLogFile> = new WatchedLogFileComparison();
    const watchedLogFile1: WatchedLogFile = new WatchedLogFile(new LogFile('/a/b/c/log.log', null), () => {});
    const watchedLogFile2: WatchedLogFile = new WatchedLogFile(new LogFile('/c/b/a/log.log', null), () => {});
    it('should return true since both watched logs have the same absolute path', function () {
        // then
        expect(comparison.equal(watchedLogFile1, watchedLogFile1)).to.be.true;
    });
    it('should return false since watched logs have different absolute paths', function () {
        // then
        expect(comparison.equal(watchedLogFile1, watchedLogFile2)).to.be.false;
    });
    it('should return true since the watched log has specified absolute path', function () {
        // then
        expect(comparison.hasId(watchedLogFile1, watchedLogFile1.logFile.absolutePath)).to.be.true;
    });
    it('should return false since the watched log has a different absolute path', function () {
        // then
        expect(comparison.hasId(watchedLogFile1, watchedLogFile2.logFile.absolutePath)).to.be.false;
    });
});