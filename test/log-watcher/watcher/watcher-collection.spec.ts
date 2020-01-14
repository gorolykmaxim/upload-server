import {expect} from "chai";
import {WatcherComparison} from "../../../app/log-watcher/watcher/watcher-collection";
import {Watcher} from "../../../app/log-watcher/watcher/watcher";
import {EntityComparison} from "../../../app/collection/in-memory-collection";

describe('WatcherComparison', function () {
    const comparison: EntityComparison<Watcher> = new WatcherComparison();
    const watcher1: Watcher = new Watcher('12345', null, null, null);
    const watcher2: Watcher = new Watcher('54321', null, null, null);
    it('should return true since both watchers have the same ID', function () {
        // then
        expect(comparison.equal(watcher1, watcher1)).to.be.true;
    });
    it('should return false since watchers have different IDs', function () {
        // then
        expect(comparison.equal(watcher1, watcher2)).to.be.false;
    });
    it('should return true since the watcher has specified ID', function () {
        // then
        expect(comparison.hasId(watcher1, watcher1.id)).to.be.true;
    });
    it('should return false since the watcher has a different ID', function () {
        // then
        expect(comparison.hasId(watcher1, watcher2.id)).to.be.false;
    });
});