function LogsView(emitter, addLogEvent, removeLogEvent, db) {
    this.emitter = emitter;
    this.addLogEvent = addLogEvent;
    this.removeLogEvent = removeLogEvent;
    this.db = db;
    this.isRestricted = false;
}

LogsView.prototype.restrict = function() {
    this.isRestricted = true;
};

LogsView.prototype.initialize = function() {
    try {
        var logsView = this.db.getData('/logs-view');
        if (logsView === undefined) {
            this.db.push('/logs-view', {logs: []});
        } else {
            for (var i = 0; i < logsView.logs.length; i++) {
                this.emitter.emit(this.addLogEvent, logsView.logs[i]);
            }
        }
    } catch (e) {
        this.db.push('/logs-view', {logs: []});
    }
};

LogsView.prototype.handleAddLog = function(req, res) {
    var log = req.body.logPath;
    var logs = this.db.getData('/logs-view/logs');
    var i = logs.indexOf(log);
    if (i < 0) {
        logs.push(log);
        this.db.push('/logs-view/logs', logs);
        this.emitter.emit(this.addLogEvent, log);
    }
    res.redirect('/web/logs-view');
};

LogsView.prototype.handleRemoveLog = function(req, res) {
    var log = req.query.path;
    var logs = this.db.getData('/logs-view/logs');
    var i = logs.indexOf(log);
    if (i >= 0) {
        logs.splice(i, 1);
        this.db.push('/logs-view/logs', logs);
        this.emitter.emit(this.removeLogEvent, log);
    }
    res.redirect('/web/logs-view');
};

LogsView.prototype.handleViewAll = function(req, res) {
    res.render('logs-view/all', {
        logs: this.db.getData('/logs-view/logs'),
        isRestricted: this.isRestricted,
        logUrlTemplate: '/web/logs-view/log',
        addLogUrlTemplate: '/web/logs-view/add'
    });
};

LogsView.prototype.handleViewOne = function(req, res) {
    res.render('logs-view/one', {
        path: req.query.path,
        isRestricted: this.isRestricted,
        removeUrlTemplate: '/web/logs-view/remove'
    });
};

LogsView.prototype.serveOn = function (app) {
    this.initialize();
    if (!this.isRestricted) {
        app.post('/web/logs-view/add', this.handleAddLog.bind(this));
        app.get('/web/logs-view/remove', this.handleRemoveLog.bind(this));
    }
    app.get('/web/logs-view', this.handleViewAll.bind(this));
    app.get('/web/logs-view/log', this.handleViewOne.bind(this));
};

module.exports = LogsView;
