var mock = require('mock-require');
var assert = require('chai').assert;
mock('mkdirp', function (path, callback) {
    callback(null);
});
var file = require('../file');

describe('file', function () {
    it('should pass error, since path is not specified', function (done) {
        file.resolveRelativePath('', undefined, function (err, path) {
            assert.isNull(path);
            assert.equal(err.message, 'Specify path, on which the file should be saved');
            done();
        })
    });
    it('should pass error, since path is located outside root directory', function (done) {
        file.resolveRelativePath('/a/b/c', '/d/e/f/a', function (err, path) {
            assert.isNull(path);
            assert.equal(err.message, 'File save path should located in a subdirectory of /a/b/c');
            done();
        })
    });
    it('should pass error, since path is located outside root directory (trying to break the server)', function (done) {
        file.resolveRelativePath('/user/', '/user/../admin/secret', function (err, path) {
            assert.isNull(path);
            assert.equal(err.message, 'File save path should located in a subdirectory of /user/');
            done();
        });
    });
    it('should pass a relative path to file', function (done) {
        file.resolveRelativePath('/a/b', '/a/b/c/d', function (err, path) {
            assert.isNull(err);
            assert.equal(path, 'c/d');
            done();
        })
    })
});
