#!/usr/bin/env node

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var childProcess = Promise.promisifyAll(require('child_process'));
var ip = require('ip');
var path = require('path');
var os = require('os');
var EventEmitter = require('events');
var http = require('http');
var https = require('https');
var express = require('express');
var winston = require('winston');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var JsonDb = require('node-json-db');
var multer = require('multer');
var tail = require('nodejs-tail');
var ws = require('ws');
var uuid = require('uuid');
var mkdirp = Promise.promisify(require('mkdirp'));
var serveIndex = require('serve-index');
var argv = require('minimist')(process.argv.slice(2));
var rimraf = Promise.promisify(require('rimraf'));
var basicAuth = require('express-basic-auth');
var md5 = require('md5');
var Deploy = require('./deploy');
var LogWatcher = require('./log-watch');
var FallbackFileWatcher = require('./fallback-file-watcher');
var LogsView = require('./logs-view');
var ApplicationLogView = require('./application-log-view');
var CommandExecutor = require('./command-executor');
var ErrorHandler = require('./error-handler');
var Authorization = require('./authorization');
var html = require('./tpl');
var pkg = require('./package.json');

var default_host = '0.0.0.0';
var default_port = argv.p || argv.port || 8090;
var default_folder = path.resolve(argv.f || argv.folder || 'files');
var version = argv.v || argv.version;
var tls_enabled = argv.S || argv.tls;
var cert_file = argv.C || argv.cert;
var key_file = argv.K || argv.key;
var isInAdminMode = argv.a || argv.admin;
var isAuthorizationEnabled = !argv.insecure;
var logFile = argv.l || argv.log || 'upload-server.log';
var databaseFile = argv.d || argv.database || 'upload-server-db';
var help = argv.h || argv.help;

var app = express();

var log = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: logFile,
      maxSize: 5000000,
      maxFiles: 1
    })
  ]
});

function _usage() {
  log.info([
    '', 'File upload server v' + pkg.version,
    '', 'usage: upload-server [options]',
    '',
    'options:',
    '  -p --port      Port number (default: 8090)',
    '  -f --folder    Folder to upload files (default: files)',
    '  -l --log       Path to the file, were logs should be written',
    '  -d --database  Path to the file, were the database should be stored',
    '  -S --tls       Enable TLS / HTTPS',
    '  -C --cert      Server certificate file',
    '  -K --key       Private key file',
    '  -h --help      Print this list and exit',
    '  -a --admin     Enable configuration via web UI',
    '  --insecure     Disable authorization of /files/ endpoints',
    '  -v --version   Print the current version',
    ''
  ].join('\n'));
  process.exit();
}

function _version() {
  log.info(pkg.version);
  process.exit();
}

if(help) {
  _usage();
}

if(version) {
  _version();
}

process.on('uncaughtException', err => console.error('Uncaught exception', err));

log.info('[' + new Date().toISOString() + '] - File upload server v' + pkg.version);

if(!fs.existsSync(default_folder)) {
  fs.mkdirSync(default_folder);
}

log.info('[' + new Date().toISOString() + '] - Serving files from folder: ' + default_folder);

var server = null;
var logStartMessage = null;
if(tls_enabled && cert_file && key_file) {
  var options = { key: fs.readFileSync(key_file), cert: fs.readFileSync(cert_file) };
  logStartMessage = '[' + new Date().toISOString() + '] - Server started on https://' + default_host + ':' + default_port;
  server = https.createServer(options, app);
}
else {
  logStartMessage = '[' + new Date().toISOString() + '] - Server started on http://' + default_host + ':' + default_port;
  server = http.createServer(app);
}

var emitter = new EventEmitter();
var db = new JsonDb(databaseFile, true, true);

app.use(bodyParser.urlencoded({extended:false}));
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars({extname: 'handlebars'}));
app.set('view engine', 'handlebars');
app.use('/', express.static(path.join(__dirname, 'views')));
app.get('/', function (req, res) {
  res.redirect('/web/dashboard');
});

if (isAuthorizationEnabled) {
    var authorization = new Authorization(basicAuth, db, console, md5);
    authorization.serveOn(app, '/files/');
}

var deploy = new Deploy(default_folder, Promise, multer, serveIndex, express, html, path, fs, mkdirp, rimraf, process,
    log);
deploy.serveOn(app);

var wss = new ws.Server({server: server});

var createTail = null;
if (os.platform() === 'win32') {
  log.info('[' + new Date().toISOString() + '] - Running under Windows. Falling back to a FallbackFileWatcher.');
  createTail = filename => new FallbackFileWatcher(filename, path.join(__dirname, 'tail.exe'), childProcess, os);
} else {
  log.info('[' + new Date().toISOString() + '] - Using chokidar file watcher');
  createTail = filename => new tail(filename, {usePolling: true});
}

var logWatcher = new LogWatcher(createTail, uuid, fs);
logWatcher.serveOn(wss);
logWatcher.listenTo(emitter);

var logsView = new LogsView(emitter, LogWatcher.ADD_WATCHABLE_FILE_EVENT, LogWatcher.REMOVE_WATCHABLE_FILE_EVENT, db);
if (!isInAdminMode) {
  logsView.restrict();
}
logsView.serveOn(app);

var applicationLogView = new ApplicationLogView(emitter, LogWatcher.ADD_WATCHABLE_FILE_EVENT, path.resolve(logFile));
applicationLogView.serveOn(app);

var commandExecutor = new CommandExecutor(childProcess, db);
if (!isInAdminMode) {
  commandExecutor.restrict();
}
commandExecutor.serveOn(app);

var errorHandler = new ErrorHandler();
errorHandler.serveOn(app);

server.listen(default_port, default_host, function () {
  log.info(logStartMessage);
});
