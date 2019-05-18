var path = require('path');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var Promise = require('bluebird');

var PathResolver = require('../file').PathResolver;

describe('file', function () {
    var pathResolver = null;
    var mkdirp = null;
    beforeEach(function () {
        mkdirp = sinon.stub().returns(Promise.resolve());
        pathResolver = new PathResolver(Promise, path, mkdirp);
    });
    it('should pass error, since path is not specified', function (done) {
        pathResolver.resolveRelativePath('', undefined).catch(function (err) {
            expect(err.message).to.equal('Specify path, on which the file should be saved');
            done();
        });
    });
    it('should pass error, since path is located outside root directory', function (done) {
        pathResolver.resolveRelativePath('/a/b/c', '/d/e/f/a').catch(function (err) {
            expect(err.message).to.equal('File save path should located in a subdirectory of /a/b/c');
            done();
        });
    });
    it('should pass error, since path is located outside root directory (trying to break the server)', function (done) {
        pathResolver.resolveRelativePath('/user/', '/user/../admin/secret').catch(function (err) {
            expect(err.message).to.equal('File save path should located in a subdirectory of /user/');
            done();
        });
    });
    it('should pass a relative path to file', function (done) {
        pathResolver.resolveRelativePath('/a/b', '/a/b/c/d').then(function (value) {
            expect(value).to.equal('c/d');
            done();
        });
    });
    it('should fail to create a directory while resolving the path', function (done) {
        var expectedError = new Error('Have no permission to modify that folder');
        mkdirp = sinon.stub().returns(Promise.reject(expectedError));
        pathResolver = new PathResolver(Promise, path, mkdirp);
        pathResolver.resolveRelativePath('/a/b', '/a/b/c/d').catch(function (err) {
            expect(err.message).to.equal(expectedError.message);
            done();
        })
    });
    it('should not try to create a folder and just resolve the path', function (done) {
        pathResolver.resolveRelativePath('/a/b', '/a/b/c/d', false).then(function (value) {
            expect(value).to.equal('c/d');
            expect(mkdirp).to.have.callCount(0);
            done();
        })
    });
});
