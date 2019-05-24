function LogsView(emitter, changeLogsEvent, db) {
    this.emitter = emitter;
    this.changeLogsEvent = changeLogsEvent;
    this.db = db;
}

LogsView.prototype.initialize = function() {
    var logsView = this.db.getData('/logs-view');
    if (logsView === undefined) {
        this.db.push('/logs-view', {logs: []});
    } else {
        this.emitter.emit(this.changeLogsEvent, logsView.logs);
    }
};

LogsView.prototype.handleAddLog = function(req, res) {
    var log = req.body.logPath;
    var logs = this.db.getData('/logs-view/logs');
    var i = logs.indexOf(log);
    if (i < 0) {
        logs.push(log);
        this.db.push('/logs-view/logs', logs);
        this.emitter.emit(this.changeLogsEvent, logs);
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
        this.emitter.emit(this.changeLogsEvent, logs);
    }
    res.redirect('/web/logs-view');
};

LogsView.prototype.handleViewAll = function(req, res) {
    res.render('logs-view/all', {logs: this.db.getData('/logs-view/logs'), logUrlTemplate: '/web/logs-view/log', addLogUrlTemplate: '/web/logs-view/add'});
};

LogsView.prototype.handleViewOne = function(req, res) {
    res.render('logs-view/one', {path: req.query.path, removeUrlTemplate: '/web/logs-view/remove'});
};

LogsView.prototype.serveOn = function (app) {
    this.initialize();
    app.post('/web/logs-view/add', this.handleAddLog.bind(this));
    app.get('/web/logs-view/remove', this.handleRemoveLog.bind(this));
    app.get('/web/logs-view', this.handleViewAll.bind(this));
    app.get('/web/logs-view/log', this.handleViewOne.bind(this));
};

module.exports = LogsView;
