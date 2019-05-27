const os = require('os');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const FallbackFileWatcher = require('../fallback-file-watcher');

chai.use(sinonChai);
const expect = chai.expect;

describe('FallbackFileWatcher', () => {
    const filename = 'C:\\Users\\user\\myfile.txt';
    const binary = 'tail.exe';
    const onelineMessage  = 'One message';
    const twolineMessage = 'Two lines\r\nOf messages';
    let watcher = null;
    let childProcess = null;
    let process = null;
    beforeEach(() => {
        process = {
            kill: sinon.stub(),
            stdout: {
                on: sinon.stub()
            },
            stderr: {
                on: sinon.stub()
            }
        };
        childProcess = {spawn: (binary, args) => process};
        watcher = new FallbackFileWatcher(filename, binary, childProcess, os);
    });
    it('should notify listeners about a single-line stdout change', done => {
        watcher.watch();
        watcher.on('line', line => {
            expect(line).to.be.equal(onelineMessage);
            done();
        });
        writeTo(process.stdout, onelineMessage);
    });
    it('should notify listeners about a multi-line stdout change', done => {
        watcher.watch();
        const linesGot = [];
        const linesExpected = twolineMessage.split(os.EOL);
        watcher.on('line', line => {
            linesGot.push(line);
            if (linesExpected.length === linesGot.length) {
                expect(linesGot).to.eql(linesExpected);
                done();
            }
        });
        writeTo(process.stdout, twolineMessage);
    });
    it('should notify listeners about a single-line stderr change', done => {
        watcher.watch();
        watcher.on('line', line => {
            expect(line).to.be.equal(onelineMessage);
            done();
        });
        writeTo(process.stderr, onelineMessage);
    });
    it('should notify listeners about a multi-line stderr change', done => {
        watcher.watch();
        const linesGot = [];
        const linesExpected = twolineMessage.split(os.EOL);
        watcher.on('line', line => {
            linesGot.push(line);
            if (linesExpected.length === linesGot.length) {
                expect(linesGot).to.eql(linesExpected);
                done();
            }
        });
        writeTo(process.stderr, twolineMessage);
    });
    it('should terminate binary process on close', () => {
        watcher.watch();
        watcher.close();
        expect(process.kill).to.have.been.calledOnceWith();
    });
});

function writeTo(channel, message) {
    const listener = channel.on.getCall(0).args[1];
    listener(message);
}
