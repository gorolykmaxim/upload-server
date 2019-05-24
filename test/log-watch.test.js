var uuid = require('uuid');
var promise = require('bluebird');

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var LogWatcher = require('../log-watch');

chai.use(sinonChai);
var expect = chai.expect;

describe('LogWatcher', function () {
    var watcher = null;
    var fs = null;
    var requestor1 = null;
    var requestor2 = null;
    var requestorId1 = uuid();
    var requestorId2 = uuid();
    var tailInstance = null;
    var file = '/files/access.log';
    var line = 'new line in the log';
    var watchMessage = JSON.stringify({type: 'watch', file: file});
    var watchFromTheBeginningMessage = JSON.stringify({type: 'watch', file: file, fromStart: true});
    var unwatchMessage = JSON.stringify({type: 'unwatch', file: file});
    var changeMessage = JSON.stringify({type: 'change', file: file, changes: [line]});
    beforeEach(function () {
        fs = sinon.stub({readFileAsync: function (file) {}});
        fs.readFileAsync.returns(promise.resolve(line));
        tailInstance = sinon.stub({
            on: function(event, callback) {},
            watch: function () {},
            removeAllListeners: function () {},
            close: function () {}
        });
        var tail = sinon.stub().returns(tailInstance);
        requestor1 = sinon.stub({send: function (message) {}});
        requestor2 = sinon.stub({send: function (message) {}});
        watcher = new LogWatcher(tail, uuid, fs);
        watcher.setAllowedToWatchFiles([file]);
    });
    it('should send logs to client, that watches them', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        var callback = tailInstance.on.getCall(0).args[1];
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(requestor1.send).to.have.been.calledOnceWith(changeMessage);
    });
    it('should send already present logs to client, that started watching them', function (done) {
        var message = JSON.stringify({type: 'change', file: file, changes: [line, line, line]});
        fs.readFileAsync.returns(promise.resolve(line + '\n' + line + '\n' + line));
        watcher.handleMessageFromRequestor(watchFromTheBeginningMessage, requestor1, requestorId1);
        fs.readFileAsync().then(function () {
            expect(requestor1.send).to.have.been.calledOnceWith(message);
            done();
        });
    });
    it('should send error to the client, since watched file does not exist', function (done) {
        fs.readFileAsync.returns(promise.reject(new Error('files does not exist')));
        watcher.handleMessageFromRequestor(watchFromTheBeginningMessage, requestor1, requestorId2);
        setTimeout(function () {
            expect(requestor1.send).to.have.been.calledOnceWith('{"type":"error","message":"Error: files does not exist"}');
            done();
        });
    });
    it('should not send logs to client, that started watching them and then stopped', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        var callback = tailInstance.on.getCall(0).args[1];
        watcher.handleMessageFromRequestor(unwatchMessage, requestor1, requestorId1);
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(1);
        expect(tailInstance.close).to.have.callCount(1);
        expect(requestor1.send).to.have.callCount(0);
    });
    it('should not send logs to client, that started watching them and then disconnected', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        var callback = tailInstance.on.getCall(0).args[1];
        watcher.unwatchAllOf(requestor1, requestorId1);
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(1);
        expect(tailInstance.close).to.have.callCount(1);
        expect(requestor1.send).to.have.callCount(0);
    });
    it('should send logs to client, that started watching them, than stopped and than resumed again', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        var callback = tailInstance.on.getCall(0).args[1];
        watcher.unwatchAllOf(requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        callback(line);
        expect(tailInstance.watch).to.have.callCount(2);
        expect(tailInstance.removeAllListeners).to.have.callCount(1);
        expect(tailInstance.close).to.have.callCount(1);
        expect(requestor1.send).to.have.been.calledOnceWith(changeMessage);
    });
    it('should respond with an error to a malformed message', function () {
        watcher.handleMessageFromRequestor('malformed message', requestor1, requestorId1);
        expect(requestor1.send).to.have.been.calledWith('{"type":"error","message":"SyntaxError: Unexpected token m in JSON at position 0"}');
    });
    it('should send logs to both clients', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor2, requestorId2);
        var callback = tailInstance.on.getCall(0).args[1];
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(requestor1.send).to.have.been.calledOnceWith(changeMessage);
        expect(requestor2.send).to.have.been.calledOnceWith(changeMessage);
    });
    it('should send logs to only one client, since the other one has cancelled the subscription', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor2, requestorId2);
        watcher.handleMessageFromRequestor(unwatchMessage, requestor2, requestorId2);
        var callback = tailInstance.on.getCall(0).args[1];
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(0);
        expect(tailInstance.close).to.have.callCount(0);
        expect(requestor1.send).to.have.been.calledOnceWith(changeMessage);
        expect(requestor2.send).to.have.callCount(0);
    });
    it('should send logs to only one client, since the other one has disconnected', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor2, requestorId2);
        watcher.unwatchAllOf(requestor2, requestorId2);
        var callback = tailInstance.on.getCall(0).args[1];
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(0);
        expect(tailInstance.close).to.have.callCount(0);
        expect(requestor1.send).to.have.been.calledOnceWith(changeMessage);
        expect(requestor2.send).to.have.callCount(0);
    });
    it('should not send logs to either of clients, since both of them have disconnected', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor2, requestorId2);
        var callback = tailInstance.on.getCall(0).args[1];
        watcher.unwatchAllOf(requestor1, requestorId1);
        watcher.unwatchAllOf(requestor2, requestorId2);
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(1);
        expect(tailInstance.close).to.have.callCount(1);
        expect(requestor1.send).to.have.callCount(0);
        expect(requestor2.send).to.have.callCount(0);
    });
    it('should not send logs to either of clients, since both of them have cancelled their subscriptions', function () {
        watcher.handleMessageFromRequestor(watchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(watchMessage, requestor2, requestorId2);
        var callback = tailInstance.on.getCall(0).args[1];
        watcher.handleMessageFromRequestor(unwatchMessage, requestor1, requestorId1);
        watcher.handleMessageFromRequestor(unwatchMessage, requestor2, requestorId2);
        callback(line);
        expect(tailInstance.watch).to.have.callCount(1);
        expect(tailInstance.removeAllListeners).to.have.callCount(1);
        expect(tailInstance.close).to.have.callCount(1);
        expect(requestor1.send).to.have.callCount(0);
        expect(requestor2.send).to.have.callCount(0);
    });
    it('should not allow user to watch file that is not on the list of allowed files', function () {
        var message = JSON.stringify({type: 'watch', file: '/admin/secret'});
        watcher.handleMessageFromRequestor(message, requestor1, requestor1);
        expect(requestor1.send).to.have.been.calledWith('{"type":"error","message":"Error: You are not allowed to watch /admin/secret"}')
    });
});
