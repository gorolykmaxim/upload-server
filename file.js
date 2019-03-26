var path = require('path');
var mkdirp = require('mkdirp');

function resolveRelativePath(rootDirectory, specifiedPath, callback, createDirectoryIfNotExists) {
    createDirectoryIfNotExists = createDirectoryIfNotExists || true;
    if (!specifiedPath) {
        callback(new Error('Specify path, on which the file should be saved'), null);
    } else {
        var absolutePathToFile = path.normalize(specifiedPath);
        if (absolutePathToFile.indexOf(rootDirectory) < 0) {
            callback(new Error('File save path should located in a subdirectory of ' + rootDirectory), null);
        } else {
            var fileDirectory = path.dirname(absolutePathToFile);
            if (createDirectoryIfNotExists) {
                mkdirp(fileDirectory, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, path.relative(rootDirectory, absolutePathToFile));
                    }
                });
            } else {
                callback(null, path.relative(rootDirectory, absolutePathToFile));
            }
        }
    }
}

module.exports.resolveRelativePath = resolveRelativePath;
