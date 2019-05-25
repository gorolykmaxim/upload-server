function CommandExecutor(childProcess, db) {
    this.childProcess = childProcess;
    this.db = db;
}

CommandExecutor.prototype.handleExecuteCommand = function(req, res, next) {
    var commandName = req.query.command;
    var commands = this.db.getData('/command-executor/commands');
    var command = commands[commandName];
    if (command === undefined) {
        throw new Error('You are not allowed to execute ' + commandName);
    } else {
        this.childProcess.execAsync(command.command, {timeout: command.timeout}).then(function (stdout, stderr) {
            stdout = stdout ? stdout.toString().split("\n") : stdout;
            stderr = stderr ? stderr.toString().split("\n") : stderr;
            res.render('command-executor/execute-results', {name: commandName, command: command, stdout: stdout, stderr: stderr});
        }).catch(function (err) {
            next(err);
        });
    }
};

CommandExecutor.prototype.handleAddCommand = function(req, res) {
    var name = req.body.name;
    if (!name) {
        throw new Error("'name' of the command is not specified");
    }
    var command = req.body.command;
    if (!command) {
        throw new Error("'command' is not specified");
    }
    var timeout = parseInt(req.body.timeout);
    if (isNaN(timeout)) {
        throw new Error("'timeout' is not specified or is not an integer");
    }
    var commands = this.db.getData('/command-executor/commands');
    commands[name] = {command: command, timeout: timeout};
    this.db.push('/command-executor/commands', commands);
    res.redirect('/web/command-executor');
};

CommandExecutor.prototype.handleRemoveCommand = function(req, res) {
    var name = req.query.command;
    var commands = this.db.getData('/command-executor/commands');
    delete commands[name];
    this.db.push('/command-executor/commands', commands);
    res.redirect('/web/command-executor');
};

CommandExecutor.prototype.handleShowAllCommands = function(req, res) {
    res.render('command-executor/all', {
        commands: this.db.getData('/command-executor/commands'),
        addCommandUrlTemplate: '/web/command-executor/add',
        removeCommandUrlTemplate: '/web/command-executor/remove',
        executeCommandUrlTemplate: '/web/command-executor/execute'
    });
};

CommandExecutor.prototype.initialize = function() {
    try {
        var commandExecutor = this.db.getData('/command-executor');
        if (commandExecutor === undefined) {
            this.db.push('/command-executor', {commands: {}});
        }
    } catch (e) {
        this.db.push('/command-executor', {commands: {}});
    }
};

CommandExecutor.prototype.serveOn = function (app) {
    this.initialize();
    app.get('/web/command-executor', this.handleShowAllCommands.bind(this));
    app.post('/web/command-executor/add', this.handleAddCommand.bind(this));
    app.get('/web/command-executor/remove', this.handleRemoveCommand.bind(this));
    app.get('/web/command-executor/execute', this.handleExecuteCommand.bind(this));
};

module.exports = CommandExecutor;
