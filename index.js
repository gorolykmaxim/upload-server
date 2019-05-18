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
var file = require('./file');
var html = require('./tpl');
var pkg = require('./package.json');
var serveIndex = require('serve-index');
var argv = require('minimist')(process.argv.slice(2));
var rimraf = Promise.promisify(require('rimraf'));
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

var pathResolver = new file.PathResolver(Promise, path, mkdirp);

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, default_folder);
  },
  filename: function(req, file, cb) {
    pathResolver.resolveRelativePath(default_folder, req.body.file).then(function (value) {
      cb(null, value);
    }).catch(function (err) {
      cb(err, null)
    });
  }
});

var upload = multer({ storage: storage });

app.use('/' + default_folder, serveIndex(process.cwd() + '/' + default_folder));
app.use('/' + default_folder, express.static(process.cwd() + '/' + default_folder));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', function(req, res) {
  res.send(html.template);
});

app.post('/', upload.any(), function(req, res) {
  console.log('[' + new Date().toISOString() + '] - File uploaded:', req.files[0].path);
  res.end();
});

app.post('/upload', upload.any(), function(req, res) {
  console.log('[' + new Date().toISOString() + '] - File uploaded:', req.files[0].path);
  res.redirect('/' + default_folder);
  res.end();
});

app.post('/move', function (req, res) {
  var newPathPromise = pathResolver.resolveRelativePath(default_folder, req.query.file);
  var oldPathPromise = pathResolver.resolveRelativePath(default_folder, req.query.old_file, false);
  Promise.all([oldPathPromise, newPathPromise]).then(function (resolvedPaths) {
    var oldPath = resolvedPaths[0];
    var newPath = resolvedPaths[1];
    var oldResolvedPath = path.join(default_folder, oldPath);
    var resolvedPath = path.join(default_folder, newPath);
    return fs.renameAsync(oldResolvedPath, resolvedPath);
  }).then(function () {
    res.end();
    console.log('[' + new Date().toISOString() + '] - ' + 'File moved from ' + req.query.old_file + ' to ' + req.query.file);
  }).catch(function (err) {
    res.status(500).end(err.toString() + '\n');
  });
});

app.post('/delete', function (req, res) {
  var absolutePath = null;
  pathResolver.resolveRelativePath(default_folder, req.query.file, false).then(function (value) {
    absolutePath = path.join(default_folder, value);
    return fs.lstatAsync(absolutePath);
  }).then(function (value) {
    if (value.isDirectory()) {
      return rimraf(absolutePath);
    } else {
      return fs.unlinkAsync(absolutePath);
    }
  }).then(function () {
    res.end();
    console.log('[' + new Date().toISOString() + '] - ' + 'File removed: ' + req.query.file);
  }).catch(function (err) {
    res.status(500).end(err.toString() + '\n');
  });
});

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
