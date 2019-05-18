function PathResolver(Promise, path, mkdirp) {
    this.Promise = Promise;
    this.path = path;
    this.mkdirp = mkdirp;
}

PathResolver.prototype.resolveRelativePath = function (rootDirectory, specifiedPath, createDirectoryIfNotExists) {
    var self = this;
    return new this.Promise(function (resolve, reject) {
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

module.exports.PathResolver = PathResolver;
