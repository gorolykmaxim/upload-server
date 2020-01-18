import {WatchableLog} from "../../../app/log-watcher/api/watchable-log";
import {URL} from "../../../app/common/url";
import { expect } from "chai";

describe('WatchableLog', function () {
    const absolutePath = '/var/log/messages';
    const logURL: URL = URL.createNew("api").append('log-watcher').append('log');
    const logSizeURL: URL = logURL.append('size');
    const logContentURL: URL = logURL.append('content');
    const log: WatchableLog = new WatchableLog(absolutePath, logURL, logSizeURL, logContentURL);
    it('should create watchable log with the specified absolute path', function () {
        // then
        expect(log.absolutePath).to.equal(absolutePath);
    });
    it('should create watchable log with a ready-to-use "watch" link', function () {
        // then
        expect(log.webSocketlinks.watch).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "watchFromBeginning" link', function () {
        // then
        expect(log.webSocketlinks.watchFromBeginning).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}&fromStart=true`);
    });
    it('should create watchable log with a ready-to-use "remove" link', function () {
        // then
        expect(log.httpLinks.remove).to.equal(`/api/log-watcher/log?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "getSize" link', function () {
        // then
        expect(log.httpLinks.getSize).to.equal(`/api/log-watcher/log/size?absolutePath=${absolutePath}`);
    });
    it('should create watchable log with a ready-to-use "getContent" link', function () {
        // then
        expect(log.httpLinks.getContent).to.equal(`/api/log-watcher/log/content?absolutePath=${absolutePath}`);
    });
});