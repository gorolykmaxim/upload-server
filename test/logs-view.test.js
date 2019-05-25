var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var LogsView = require('../logs-view');

chai.use(sinonChai);
var expect = chai.expect;

describe('LogsView', function () {
    var addLogEvent = 'add watchable log';
    var removeLogEvent = 'remove watchable log';
    var logsView = null;
    var emitter = null;
    var db = null;
    var logs = null;
    var newLog = 'log4';
    var logsViewData = null;
    var req = {body: {}, query: {}};
    var res = null;
    beforeEach(function () {
        logs = ['log1', 'log2', 'log3'];
        logsViewData = {logs: logs};
        emitter = sinon.stub({emit: function (event, data) {}});
        res = sinon.stub({redirect: function (url) {}, render: function (view, data) {}});
        db = sinon.stub({getData: function (path) {}, push: function (path, data) {}});
        db.getData.returns(logs);
        logsView = new LogsView(emitter, addLogEvent, removeLogEvent, db);
    });
    it('should initialize database if it is empty', function () {
        db.getData.returns(undefined);
        logsView.initialize();
        expect(db.push).to.have.been.calledOnceWith('/logs-view', {logs: []});
    });
    it('should initialize database if it has failed to find expected data structures', function () {
        db.getData.throws(new Error());
        logsView.initialize();
        expect(db.push).to.have.been.calledOnceWith('/logs-view', {logs: []});
    });
    it('should notify application about logs that can be watched', function () {
        db.getData.returns(logsViewData);
        logsView.initialize();
        logs.forEach(function (value) {
            expect(emitter.emit).to.have.been.calledWith(addLogEvent, value);
        });
    });
    it('should add specified log to the list of watched logs', function () {
        var expectedLogs = logs.concat(newLog);
        req.body.logPath = newLog;
        logsView.handleAddLog(req, res);
        expect(db.push).to.have.been.calledOnceWith('/logs-view/logs', expectedLogs);
        expect(emitter.emit).to.have.been.calledOnceWith(addLogEvent, newLog);
        expect(res.redirect).to.have.been.calledOnceWith('/web/logs-view');
    });
    it('should not add log to the list of watched logs, since the log is already there', function () {
        req.body.logPath = logs[0];
        logsView.handleAddLog(req, res);
        expect(db.push).to.have.callCount(0);
        expect(emitter.emit).to.have.callCount(0);
        expect(res.redirect).to.have.been.calledOnceWith('/web/logs-view');
    });
    it('should remove specified log from the list of watched logs', function () {
        var expectedLogs = logs.slice(1);
        var removedLog = logs[0];
        req.query.path = removedLog;
        logsView.handleRemoveLog(req, res);
        expect(db.push).to.have.been.calledOnceWith('/logs-view/logs', expectedLogs);
        expect(emitter.emit).to.have.been.calledOnceWith(removeLogEvent, removedLog);
        expect(res.redirect).to.have.been.calledOnceWith('/web/logs-view');
    });
    it('should not remove log from the list of watched logs, since the log is not in it', function () {
        req.query.path = newLog;
        logsView.handleRemoveLog(req, res);
        expect(db.push).to.have.callCount(0);
        expect(emitter.emit).to.have.callCount(0);
        expect(res.redirect).to.have.been.calledOnceWith('/web/logs-view');
    });
    it('should display page with all logs', function () {
        logsView.handleViewAll(req, res);
        expect(res.render).to.have.been.calledOnceWith('logs-view/all',
            {
                logs: logs,
                isRestricted: false,
                logUrlTemplate: '/web/logs-view/log',
                addLogUrlTemplate: '/web/logs-view/add'
            });
    });
    it('should display page with specific log', function () {
        req.query.path = logs[0];
        logsView.handleViewOne(req, res);
        expect(res.render).to.have.been.calledOnceWith('logs-view/one',
            {
                path: logs[0],
                isRestricted: false,
                removeUrlTemplate: '/web/logs-view/remove'
            });
    });
});
