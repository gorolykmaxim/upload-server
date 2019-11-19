function PathResolver(promise, path, mkdirp) {
    this.promise = promise;
    this.path = path;
    this.mkdirp = mkdirp;
}

PathResolver.prototype.resolveRelativePath = function (rootDirectory, specifiedPath, createDirectoryIfNotExists) {
    var self = this;
    return new this.promise(function (resolve, reject) {
        createDirectoryIfNotExists = createDirectoryIfNotExists === undefined ? true : createDirectoryIfNotExists;
        if (!specifiedPath) {
            reject(new Error('Specify path, on which the file should be saved'));
        } else {
            var absolutePathToFile = self.path.normalize(specifiedPath);
            if (absolutePathToFile.indexOf(rootDirectory) < 0) {
                reject(new Error('File save path should located in a subdirectory of ' + rootDirectory));
            } else {
                var fileDirectory = self.path.dirname(absolutePathToFile);
                if (createDirectoryIfNotExists) {
                    self.mkdirp(fileDirectory).then(function () {
                        resolve(self.path.relative(rootDirectory, absolutePathToFile))
                    }).catch(reject);
                } else {
                    resolve(self.path.relative(rootDirectory, absolutePathToFile));
                }
            }
        }
    });
};

function Deploy(defaultFolder, promise, multer, serveIndex, express, html, path, fs, mkdirp, rimraf, process, log) {
    this.defaultFolder = defaultFolder;
    this.promise = promise;
    this.multer = multer;
    this.serveIndex = serveIndex;
    this.express = express;
    this.html = html;
    this.path = path;
    this.fs = fs;
    this.rimraf = rimraf;
    this.process = process;
    this.log = log;
    this.pathResolver = new PathResolver(promise, path, mkdirp);
}

Deploy.prototype.resolveFilenameToUpload = function(req, file, cb) {
    this.pathResolver.resolveRelativePath(this.defaultFolder, req.body.file).then(function (value) {
        cb(null, value);
    }).catch(function (err) {
        cb(err, null)
    });
};

Deploy.prototype.respondWithError = function(response, error) {
    response.status(500).end(`${error.toString()}\n`);
};

Deploy.prototype.handleRawBodyUpload = function(req, res, next) {
    if (req.header('content-type') === 'application/octet-stream') {
        this.pathResolver.resolveRelativePath(this.defaultFolder, req.query.name).then(value => {
            const fileStream = this.fs.createWriteStream(this.path.join(this.defaultFolder, value));
            req.on('data', fileStream.write.bind(fileStream));
            req.on('end', () => {
                fileStream.end();
                next();
            });
        }).catch(err => this.respondWithError(res, err));
    } else {
        next();
    }
};

Deploy.prototype.handleMove = function(req, res) {
    var self = this;
    var newPathPromise = self.pathResolver.resolveRelativePath(self.defaultFolder, req.query.file);
    var oldPathPromise = self.pathResolver.resolveRelativePath(self.defaultFolder, req.query.old_file, false);
    self.promise.all([oldPathPromise, newPathPromise]).then(function (resolvedPaths) {
        var oldPath = resolvedPaths[0];
        var newPath = resolvedPaths[1];
        var oldResolvedPath = self.path.join(self.defaultFolder, oldPath);
        var resolvedPath = self.path.join(self.defaultFolder, newPath);
        return self.fs.renameAsync(oldResolvedPath, resolvedPath);
    }).then(function () {
        self.log.info('[' + new Date().toISOString() + '] - ' + 'File moved from ' + req.query.old_file + ' to ' + req.query.file);
        res.end();
    }).catch(function (err) {
        self.respondWithError(res, err);
    });
};

Deploy.prototype.handleDelete = function(req, res) {
    var self = this;
    var absolutePath = null;
    self.pathResolver.resolveRelativePath(self.defaultFolder, req.query.file, false).then(function (value) {
        absolutePath = self.path.join(self.defaultFolder, value);
        return self.fs.lstatAsync(absolutePath);
    }).then(function (value) {
        if (value.isDirectory()) {
            return self.rimraf(absolutePath);
        } else {
            return self.fs.unlinkAsync(absolutePath);
        }
    }).then(function () {
        self.log.info('[' + new Date().toISOString() + '] - ' + 'File removed: ' + req.query.file);
        res.end();
    }).catch(function (err) {
        res.status(500).end(err.toString() + '\n');
    });
};

Deploy.prototype.serveOn = function (app) {
    var self = this;
    var storage = self.multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, self.defaultFolder);
        },
        filename: self.resolveFilenameToUpload.bind(self)
    });
    var upload = self.multer({ storage: storage });
    app.use('/files/' + self.defaultFolder, self.serveIndex(self.process.cwd() + '/' + self.defaultFolder));
    app.use('/files/' + self.defaultFolder, self.express.static(self.process.cwd() + '/' + self.defaultFolder));
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.get('/files/', function(req, res) {
        res.send(self.html.template);
    });
    app.post('/files/', upload.any(), self.handleRawBodyUpload.bind(self), function(req, res) {
        self.log.info('[' + new Date().toISOString() + '] - File uploaded: ' + req.files[0].path);
        res.end();
    });
    app.post('/files/upload', upload.any(), self.handleRawBodyUpload.bind(self), function(req, res) {
        self.log.info('[' + new Date().toISOString() + '] - File uploaded: ' + req.files[0].path);
        res.redirect('/' + self.defaultFolder);
        res.end();
    });
    app.post('/files/move', self.handleMove.bind(self));
    app.post('/files/delete', self.handleDelete.bind(self));
};

module.exports = Deploy;
