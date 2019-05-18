#!/usr/bin/env node

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var ip = require('ip');
var path = require('path');
var http = require('http');
var https = require('https');
var express = require('express');
var multer = require('multer');
var mkdirp = Promise.promisify(require('mkdirp'));
var serveIndex = require('serve-index');
var argv = require('minimist')(process.argv.slice(2));
var rimraf = Promise.promisify(require('rimraf'));
var Deploy = require('./deploy');
var html = require('./tpl');
var pkg = require('./package.json');

var app = express();

var default_host = ip.address();
var default_port = argv.p || argv.port || 8090;
var default_folder = path.resolve(argv.f || argv.folder || 'files');
var version = argv.v || argv.version;
var tls_enabled = argv.S || argv.tls;
var cert_file = argv.C || argv.cert;
var key_file = argv.K || argv.key;
var help = argv.h || argv.help;

function _usage() {
  console.log([
    '', 'File upload server v' + pkg.version,
    '', 'usage: upload-server [options]',
    '',
    'options:',
    '  -p --port    Port number (default: 8090)',
    '  -f --folder  Folder to upload files (default: files)',
    '  -S --tls     Enable TLS / HTTPS',
    '  -C --cert    Server certificate file',
    '  -K --key     Private key file',
    '  -h --help    Print this list and exit',
    '  -v --version Print the current version',
    ''
  ].join('\n'));
  process.exit();
}

function _version() {
  console.log(pkg.version);
  process.exit();
}

if(help) {
  _usage();
}

if(version) {
  _version();
}

console.log('[' + new Date().toISOString() + '] - File upload server v' + pkg.version);

if(!fs.existsSync(default_folder)) {
  fs.mkdirSync(default_folder);
}

console.log('[' + new Date().toISOString() + '] - Serving files from folder:', default_folder);

var deploy = new Deploy(default_folder, Promise, multer, serveIndex, express, html, path, fs, mkdirp, rimraf, process,
    console);
deploy.serveOn(app);

if(tls_enabled && cert_file && key_file) {
  var options = { key: fs.readFileSync(key_file), cert: fs.readFileSync(cert_file) };
  https.createServer(options, app).listen(default_port, default_host, function() {
    console.log('[' + new Date().toISOString() + '] - Server started on https://' + default_host + ':' + default_port);
  });
}
else {
  http.createServer(app).listen(default_port, default_host, function() {
    console.log('[' + new Date().toISOString() + '] - Server started on http://' + default_host + ':' + default_port);
  });
}
