function LogWatcher(tail, uuid, fs) {
    this.tail = tail;
    this.uuid = uuid;
    this.fs = fs;
    this.filenameToTail = {};
    this.requestorToFilenames = {};
    this.filenameToRequestors = {};
    this.watchableFiles = [];
}

LogWatcher.prototype.setAllowedToWatchFiles = function(watchableFiles) {
    this.watchableFiles = watchableFiles;
};

LogWatcher.prototype.sendChange = function(recipient, filename, changes) {
    var change = JSON.stringify({type: 'change', file: filename, changes: changes});
    recipient.send(change);
};

LogWatcher.prototype.sendError = function(recipient, e) {
    var error = JSON.stringify({type: 'error', message: e.toString()});
    recipient.send(error);
};

LogWatcher.prototype.watch = function(filename, requestor, requestorId, fromStart) {
    var self = this;
    var tail = self.filenameToTail[filename];
    if (tail === undefined) {
        tail = self.tail(filename);
        tail.on('line', function (line) {
            var requestors = self.filenameToRequestors[filename];
            for (var i = 0; i < requestors.length; i++) {
                self.sendChange(requestors[i], filename, [line]);
            }
        });
        tail.watch();
        self.filenameToTail[filename] = tail;
    }
    if (self.requestorToFilenames[requestorId] === undefined) {
        self.requestorToFilenames[requestorId] = [];
    }
    if (self.requestorToFilenames[requestorId].indexOf(filename) < 0) {
        self.requestorToFilenames[requestorId].push(filename);
        if (fromStart) {
            self.fs.readFileAsync(filename).then(function (value) {
                self.sendChange(requestor, filename, value.toString().split('\n'));
            }).catch(function (err) {
                self.sendError(requestor, err);
            });
        }
    }
    if (self.filenameToRequestors[filename] === undefined) {
        self.filenameToRequestors[filename] = [];
    }
    if (self.filenameToRequestors[filename].indexOf(requestor) < 0) {
        self.filenameToRequestors[filename].push(requestor);
    }
};

LogWatcher.prototype.unwatch = function(filename, requestor, requestorId) {
    var self = this;
    var arr = self.requestorToFilenames[requestorId];
    var index = null;
    if (arr !== undefined) {
        index = arr.indexOf(filename);
        if (index >= 0) {
            arr.splice(index, 1);
        }
    }
    arr = self.filenameToRequestors[filename];
    if (arr !== undefined) {
        index = arr.indexOf(requestor);
        var tail = self.filenameToTail[filename];
        if (index >= 0) {
            arr.splice(index, 1);
        }
        if (self.filenameToRequestors[filename].length === 0) {
            tail.removeAllListeners();
            tail.close();
            delete self.filenameToTail[filename];

        }
    }
};

LogWatcher.prototype.unwatchAllOf = function(requestor, requestorId) {
    var self = this;
    if (self.requestorToFilenames[requestorId] !== undefined) {
        self.requestorToFilenames[requestorId].forEach(function (filename) {
            self.unwatch(filename, requestor, requestorId);
        });
    }
};

LogWatcher.prototype.handleMessageFromRequestor = function(message, requestor, requestorId) {
    try {
        message = JSON.parse(message);
        var type = message.type;
        var file = message.file;
        var fromStart = message.fromStart || false;
        if (this.watchableFiles.indexOf(file) < 0) {
            throw new Error('You are not allowed to watch ' + file);
        }
        if (type === 'watch') {
            this.watch(file, requestor, requestorId, fromStart);
        } else if (type === 'unwatch') {
            this.unwatch(file, requestor, requestorId);
        }
    } catch (e) {
        this.sendError(requestor, e);
    }
};

LogWatcher.prototype.serveOn = function(wss) {
    var self = this;
    wss.on('connection', function (connection) {
        var connectionId = self.uuid();
        connection.on('message', function (message) {
            self.handleMessageFromRequestor(message, connection, connectionId);
        });
        connection.on('close', function () {
            self.unwatchAllOf(connection, connectionId);
        });
    });
};

module.exports = LogWatcher;
