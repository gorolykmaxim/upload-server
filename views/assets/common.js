function LogDisplayer(logPath, $logContainer) {
    this.logPath = logPath;
    this.$logContainer = $logContainer;
    this.$errorContainer = null;
}

LogDisplayer.prototype.setErrorContainer = function($errorContainer) {
    this.$errorContainer = $errorContainer;
};

LogDisplayer.prototype.displayFull = function() {
    this.display(true);
};

LogDisplayer.prototype.display = function (isFull) {
    var self = this;
    isFull = isFull || false;
    var webSocket = new WebSocket('ws://' + window.location.hostname + ':8090/');
    webSocket.addEventListener('open', function (ev) {
        webSocket.send(JSON.stringify({type: 'watch', file: self.logPath, fromStart: isFull}));
    });
    webSocket.addEventListener('message', function (ev) {
        var change = JSON.parse(ev.data);
        if (change.type === 'change' && change.file === self.logPath) {
            change.changes.forEach(function (value) {
                self.$logContainer.append('<p>' + value + '</p>');
                if ($(window).scrollTop() >= $(document).height() - $(window).height() * 1.2) {
                    window.scrollTo(0, document.body.scrollHeight);
                }
            });
        } else if (change.type === 'error' && self.$errorContainer !== null) {
            self.$errorContainer.removeClass('d-none');
            self.$errorContainer.html(change.message);
        }
    });
};
