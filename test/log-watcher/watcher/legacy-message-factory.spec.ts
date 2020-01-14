import {expect} from "chai";
import {LegacyMessageFactory} from "../../../app/log-watcher/watcher/legacy-message-factory";
import {MessageFactory} from "../../../app/log-watcher/watcher/message-factory";
import {LogFile} from "../../../app/log-watcher/log/log-file";

describe('LegacyMessageFactory', function () {
    const logFile = new LogFile('/a/b/c/log-file.log', null);
    const factory: MessageFactory = new LegacyMessageFactory();
    it('should create message about changes', function () {
        // given
        const changes = ['line 1', 'line 2'];
        // when
        const message = factory.createLogChangeMessage(logFile, changes);
        // then
        expect(message).to.equal(JSON.stringify({type: 'change', file: logFile.absolutePath, changes: changes}));
    });
    it('should create message about an error', function () {
        // given
        const error = new Error('Some error has happened');
        // when
        const message = factory.createErrorMessage(error);
        // then
        expect(message).to.equal(JSON.stringify({type: 'error', message: error.message}));
    });
});