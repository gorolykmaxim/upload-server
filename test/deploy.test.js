var promise = require('bluebird');
var path = require('path');

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var Deploy = require('../deploy');

chai.use(sinonChai);
var expect = chai.expect;

describe('Deploy', function () {
    var deploy = null;
    var defaultFolder = '/files';
    var ioError = new Error('No permission to do that');
    var fs = null;
    var mkdirp = null;
    var rimraf = null;
    var log = null;
    var fileInformation = null;
    var app = null;
    var req = null;
    var res = null;
    beforeEach(function () {
        var serveIndex = sinon.stub();
        var express = sinon.stub();
        var html = sinon.stub();
        var process = sinon.stub();
        var multer = sinon.stub();
        fileInformation = sinon.stub({isDirectory: function () {}});
        fs = sinon.stub({
            renameAsync: function (oldPath, newPath) {},
            lstatAsync: function (absolutePath) {},
            unlinkAsync: function (absolutePath) {}
        });
        mkdirp = sinon.stub().returns(promise.resolve());
        rimraf = sinon.stub().returns(promise.resolve());
        log = sinon.stub({
            info: function (message) {}
        });

        app = sinon.stub();
        req = {body: {}, query: {}};
        res = {status: sinon.stub()};
        res.status.returns(res);
        deploy = new Deploy(defaultFolder, promise, multer, serveIndex, express, html, path, fs, mkdirp, rimraf, process, log);
    });
    it('should not upload file, since the upload path is not specified', function (done) {
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.be.null;
            expect(err.message).to.equal('Specify path, on which the file should be saved');
            done();
        })
    });
    it('should not upload file, since the upload path is located outside the root directory', function (done) {
        req.body.file = '/admin/dont-upload-here/file';
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.be.null;
            expect(err.message).to.equal('File save path should located in a subdirectory of /files');
            done();
        })
    });
    it('should not upload file, since the upload path is indirectly located outside the root directory', function (done) {
        req.body.file = '/files/../admin/dont-upload-here/file';
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.be.null;
            expect(err.message).to.equal('File save path should located in a subdirectory of /files');
            done();
        })
    });
    it('should not upload file, since it has failed to create a new directory to which the file should be uploaded', function (done) {
        req.body.file = '/files/directory-that-cant-be-created/file';
        mkdirp.returns(Promise.reject(ioError));
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.be.null;
            expect(err.message).to.equal(ioError.message);
            done();
        })
    });
    it('should upload the file to the specified location, while creating it\'s parent directory', function (done) {
        req.body.file = '/files/new-directory/file';
        mkdirp.returns(Promise.resolve());
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.equal('new-directory/file');
            expect(err).to.be.null;
            expect(mkdirp).to.have.been.called;
            done();
        })
    });
    it('should not upload file to the specified location, since the location does not start from the root directory path', function (done) {
        req.body.file = ' /files/file';
        deploy.resolveFilenameToUpload(req, null, function (err, val) {
            expect(val).to.be.null;
            expect(err.message).to.equal('File save path should located in a subdirectory of /files');
            done();
        });
    });
    it('should not move file, since the new file location is not specified', function (done) {
        expectErrorResponse(res, done, 'Error: Specify path, on which the file should be saved\n');
        deploy.handleMove(req, res);
    });
    it('should not move file, since the old file location is not specified', function (done) {
        req.query.file = '/files/newFolder/file';
        expectErrorResponse(res, done, 'Error: Specify path, on which the file should be saved\n');
        deploy.handleMove(req, res);
    });
    it('should not move file, since the new file location is outside the root directory', function (done) {
        req.query.file = '/files/../admin/secret';
        req.query.old_file = '/files/folder/file';
        expectErrorResponse(res, done, 'Error: File save path should located in a subdirectory of /files\n');
        deploy.handleMove(req, res);
    });
    it('should not move file, since the old file location is outside the root directory', function (done) {
        req.query.file = '/files/newFolder/file';
        req.query.old_file = '/files/../admin/secret';
        expectErrorResponse(res, done, 'Error: File save path should located in a subdirectory of /files\n');
        deploy.handleMove(req, res);
    });
    it('should fail to move the file due to some IO-related error', function (done) {
        req.query.file = '/files/newFolder/file';
        req.query.old_file = '/files/oldFodlerThatDoesNotExist/file';
        fs.renameAsync.returns(promise.reject(ioError));
        expectErrorResponse(res, done, ioError.toString() + '\n');
        deploy.handleMove(req, res);
    });
    it('should move file from one folder to the other, while creating the latter one', function (done) {
        req.query.file = '/files/newFolder/file';
        req.query.old_file = '/files/oldFolder/file';
        fs.renameAsync.returns(promise.resolve());
        res.end = function () {
            expect(mkdirp).to.have.been.calledWith('/files/newFolder');
            expect(fs.renameAsync).to.have.been.calledWith(req.query.old_file, req.query.file);
            var logMessage = log.info.getCall(0).args[0];
            expect(logMessage).to.include('File moved from ' + req.query.old_file + ' to ' + req.query.file);
            done();
        };
        deploy.handleMove(req, res);
    });
    it('should not remove file, since the new file location is not specified', function (done) {
        expectErrorResponse(res, done, 'Error: Specify path, on which the file should be saved\n');
        deploy.handleDelete(req, res);
    });
    it('should not remove file, since the file location is outside the root directory', function (done) {
        req.query.file = '/files/../admin/secret';
        expectErrorResponse(res, done, 'Error: File save path should located in a subdirectory of /files\n');
        deploy.handleDelete(req, res);
    });
    it('should not remove file, since it has failed to check if the file is a directory or not', function (done) {
        req.query.file = '/files/file';
        fs.lstatAsync.returns(promise.reject(ioError));
        expectErrorResponse(res, done, ioError.toString() + '\n');
        deploy.handleDelete(req, res);
    });
    it('should fail to remove a directory', function (done) {
        fileInformation.isDirectory.returns(true);
        req.query.file = '/files/file';
        fs.lstatAsync.returns(promise.resolve(fileInformation));
        rimraf.returns(promise.reject(ioError));
        expectErrorResponse(res, done, ioError.toString() + '\n');
        deploy.handleDelete(req, res);
    });
    it('should fail to remove a file', function (done) {
        fileInformation.isDirectory.returns(false);
        req.query.file = '/files/file';
        fs.lstatAsync.returns(promise.resolve(fileInformation));
        fs.unlinkAsync.returns(promise.reject(ioError));
        expectErrorResponse(res, done, ioError.toString() + '\n');
        deploy.handleDelete(req, res);
    });
    it('should remove a directory', function (done) {
        fileInformation.isDirectory.returns(true);
        req.query.file = '/files/file';
        fs.lstatAsync.returns(promise.resolve(fileInformation));
        rimraf.returns(promise.resolve());
        expectToRemoveFile(res, done, log, rimraf, req.query.file);
        deploy.handleDelete(req, res);
    });
    it('should remove a file', function (done) {
        fileInformation.isDirectory.returns(false);
        req.query.file = '/files/file';
        fs.lstatAsync.returns(promise.resolve(fileInformation));
        fs.unlinkAsync.returns(promise.resolve());
        expectToRemoveFile(res, done, log, fs.unlinkAsync, req.query.file);
        deploy.handleDelete(req, res);
    });
});

function expectErrorResponse(res, done, errorMessage) {
    res.end = function(data) {
        expect(res.status).to.have.been.calledWith(500);
        expect(data).to.equal(errorMessage);
        done();
    };
}

function expectToRemoveFile(res, done, log, removalFunction, file) {
    res.end = function () {
        expect(removalFunction).to.have.been.calledWith(file);
        var logMessage = log.info.getCall(0).args[0];
        expect(logMessage).to.include('File removed: ' + file);
        done();
    };
}
