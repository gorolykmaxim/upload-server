const EventEmitter = require('events');

class Buffer {
    constructor() {
        this.data = null;
    }
    write(data) {
        this.data = data;
    }
    read() {
        return this.data;
    }
    isEmpty() {
        return this.data === null;
    }
    clear() {
        this.data = null;
    }
}

class FallbackFileWatcher extends EventEmitter {
    constructor(filename, binaryPath, childProcess, os) {
        super();
        this.filename = filename;
        this.binary = binaryPath;
        this.childProcess = childProcess;
        this.os = os;
        this.process = null;
        this.stdoutBuffer = new Buffer();
        this.stderrBuffer = new Buffer();
    }
    watch() {
        this.process = this.childProcess.spawn(this.binary, ['-f', this.filename]);
        this.process.stdout.on('data', data => this._handleData(data, this.stdoutBuffer));
        this.process.stderr.on('data', data => this._handleData(data, this.stderrBuffer));
    }
    _handleData(data, buffer) {
        data = data.toString();
        if (!buffer.isEmpty()) {
            // Non-empty buffer means, that last chunk of logs, received by the file watcher, had last line
            // interrupted. This means that the first line of current chunk is the continuation of that line.
            data = buffer.read() + data;
            buffer.clear();
        }
        const lines = data.split(this.os.EOL);
        const lastLine = lines.pop();
        if (lastLine !== '') {
            // We've just split a string by line-ending delimiter. That string didn't end with a line-ending symbol,
            // it means that line was not complete. We will not emit that line and save it until next time, since next
            // time we will receive the rest of that line.
            buffer.write(lastLine);
        }
        lines.forEach(line => this.emit('line', line));
    }
    close() {
        this.process.kill('SIGKILL');
    }
}

module.exports = FallbackFileWatcher;
