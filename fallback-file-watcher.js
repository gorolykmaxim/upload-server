const EventEmitter = require('events');

class FallbackFileWatcher extends EventEmitter {
    constructor(filename, binaryPath, childProcess, os) {
        super();
        this.filename = filename;
        this.binary = binaryPath;
        this.childProcess = childProcess;
        this.os = os;
        this.process = null;
    }
    watch() {
        this.process = this.childProcess.spawn(this.binary, ['-f', this.filename]);
        this.process.stdout.on('data', this._handleData.bind(this));
        this.process.stderr.on('data', this._handleData.bind(this));
    }
    _handleData(data) {
        data.toString().split(this.os.EOL).forEach(line => this.emit('line', line));
    }
    close() {
        this.process.kill('SIGKILL');
    }
}

module.exports = FallbackFileWatcher;
