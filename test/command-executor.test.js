var promise = require('bluebird');

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var CommandExecutor = require('../command-executor');

chai.use(sinonChai);
var expect = chai.expect;

describe('CommandExecutor', function () {
    var executor = null;
    var childProcess = null;
    var db = null;
    var commands = null;
    var req = {query: {}, body: {}};
    var res = null;
    beforeEach(function () {
        commands = {
            "Start server": {
                command: 'npm start',
                timeout: 1000
            },
            "Stop server": {
                command: 'npm stop',
                timeout: 1000
            }
        };
        childProcess = sinon.stub({execAsync: function (command, opts) {}});
        db = sinon.stub({getData: function(path){}, push: function(path, data){}});
        res = sinon.stub({render: function(page, data){}, redirect: function(url){}});
        db.getData.returns(commands);
        executor = new CommandExecutor(childProcess, db);
    });
    it('should initialize data structures in database if database does not exist yet', function () {
        db.getData.returns(undefined);
        executor.initialize();
        expect(db.push).to.have.been.calledOnceWith('/command-executor', {commands: {}});
    });
    it('should initialize data structures in database if database exists but there no data structures in it', function () {
        db.getData.throws(new Error());
        executor.initialize();
        expect(db.push).to.have.been.calledOnceWith('/command-executor', {commands: {}});
    });
    it('should not try to initialize database if it is already initialized', function () {
        db.getData.returns({commands: commands});
        executor.initialize();
        expect(db.push).to.have.callCount(0);
    });
    it('should display page with all allowed commands', function () {
        executor.handleShowAllCommands(req, res);
        expect(res.render).to.have.been.calledOnceWith('command-executor/all',
            {
                commands: commands,
                isRestricted: false,
                addCommandUrlTemplate: '/web/command-executor/add',
                removeCommandUrlTemplate: '/web/command-executor/remove',
                executeCommandUrlTemplate: '/web/command-executor/execute'
            });
    });
    it('should not add command with no name specified', function () {
        expect(executor.handleAddCommand.bind(executor, req, res)).to.throw("'name' of the command is not specified");
    });
    it('should not add command with no command specified', function () {
        req.body.name = 'Show storage';
        expect(executor.handleAddCommand.bind(executor, req, res)).to.throw("'command' is not specified");
    });
    it('should not add command with no timeout specified', function () {
        req.body.name = 'Show storage';
        req.body.command = 'df -h';
        expect(executor.handleAddCommand.bind(executor, req, res)).to.throw("'timeout' is not specified or is not an integer");
    });
    it('should not add command with incorrect timeout specified', function () {
        req.body.name = 'Show storage';
        req.body.command = 'df -h';
        req.body.timeout = 'not a timeout';
        expect(executor.handleAddCommand.bind(executor, req, res)).to.throw("'timeout' is not specified or is not an integer");
    });
    it('should save a command', function () {
        req.body.name = 'Show storage';
        req.body.command = 'df -h';
        req.body.timeout = 1000;
        var expectedCommands = Object.assign({'Show storage': {command: req.body.command, timeout: req.body.timeout}}, commands);
        executor.handleAddCommand(req, res);
        expect(db.push).to.have.been.calledOnceWith('/command-executor/commands', expectedCommands);
        expect(res.redirect).to.have.been.calledOnceWith('/web/command-executor');
    });
    it('should remove a command', function () {
        req.query.command = "Start server";
        var expectedCommands = {"Stop server": commands["Stop server"]};
        executor.handleRemoveCommand(req, res);
        expect(db.push).to.have.been.calledOnceWith('/command-executor/commands', expectedCommands);
        expect(res.redirect).to.have.been.calledOnceWith('/web/command-executor');
    });
    it('should not execute a command that is not a on list', function () {
        req.query.command = "Wipe the system";
        expect(executor.handleExecuteCommand.bind(executor, req, res)).to.throw('You are not allowed to execute ' + req.query.command);
    });
    it('should successfully execute a command', function (done) {
        var name = req.query.command = 'Start server';
        childProcess.execAsync.returns(promise.resolve('server successfully started\r\nlistening at 443'));
        res.render = function(view, data) {
            expect(view).to.be.equal('command-executor/execute-results');
            expect(data).to.eql({
                name: name,
                command: commands[name],
                stdout: ['server successfully started\r', 'listening at 443'],
                stderr: undefined
            });
            done();
        };
        executor.handleExecuteCommand(req, res);
    });
    it('should fail to execute a command and pass an error information about it next', function (done) {
        req.query.command = 'Start server';
        var error = new Error();
        childProcess.execAsync.returns(promise.reject(error));
        function next(err) {
            expect(err).to.be.equal(error);
            done();
        }
        executor.handleExecuteCommand(req, res, next);
    });
});
