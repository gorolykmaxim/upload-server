function ApplicationLogView(emitter, addLogEvent, applicationLogFile) {
    this.emitter = emitter;
    this.addLogEvent = addLogEvent;
    this.applicationLogFile = applicationLogFile;
}

ApplicationLogView.prototype.handleViewApplicationLog = function(req, res) {
    res.render('application-log-view/application-log', {logFile: this.applicationLogFile});
};

ApplicationLogView.prototype.serveOn = function (app) {
    this.emitter.emit(this.addLogEvent, this.applicationLogFile);
    app.get('/web/dashboard', this.handleViewApplicationLog.bind(this));
};


module.exports = ApplicationLogView;
