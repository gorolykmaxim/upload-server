import {expect} from "chai";
import {MessageFactory} from "../../../app/log-watcher/watcher/message-factory";
import {DefaultMessageFactory} from "../../../app/log-watcher/watcher/default-message-factory";
import {LogFile} from "../../../app/log-watcher/log/log-file";

describe('DefaultMessageFactory', function () {
    const logFile = new LogFile('/a/b/c/log-file.log', null);
    const factory: MessageFactory = new DefaultMessageFactory();
    it('should create message about changes', function () {
        // given
        const changes = ['line 1', 'line 2'];
        // when
        const message = factory.createLogChangeMessage(logFile, changes);
        // then
        expect(message).to.equal(JSON.stringify({type: 'change', changes: changes}));
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