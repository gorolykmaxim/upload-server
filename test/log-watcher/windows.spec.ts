import {ContentReadError, ContentSizeError, FileSystem, LogFileFactory} from "../../app/log-watcher/log";
import {ChildProcess} from "child_process";
import {CreateChildProcess, WindowsLogFileFactory} from "../../app/log-watcher/windows";
import {instance, mock, verify, when} from "ts-mockito";
import {EOL} from "os";
import {expect} from "chai";
import {Readable} from "stream";
import {Stats} from "fs";
import * as chai from "chai";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('WindowsContent', function () {
    const tailBinaryPath = 'tail.exe';
    const fileName = 'my-log.log';
    const listener = () => {};
    let fileSystem: FileSystem;
    let tailProcess: ChildProcess;
    let childProcess: CreateChildProcess;
    let factory: LogFileFactory;
    beforeEach(function () {
        tailProcess = mock<ChildProcess>();
        const readable = new Readable();
        readable.push(null);
        when(tailProcess.stdout).thenReturn(readable);
        when(tailProcess.stderr).thenReturn(readable);
        childProcess = (binaryPath, args) => {
            if (binaryPath === tailBinaryPath && args[0] === '-f' && args[1] === fileName) {
                return instance(tailProcess);
            }
        };
        fileSystem = mock<FileSystem>();
        factory = new WindowsLogFileFactory(tailBinaryPath, EOL, childProcess, instance(fileSystem));
    });
    it('should add a change listener', function () {
        // given
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener(listener);
        // then
        expect(log.hasContentChangesListeners()).to.be.true;
    });
    it('should remove a change listener', function () {
        // given
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener(listener);
        log.removeContentChangesListener(listener);
        // then
        expect(log.hasContentChangesListeners()).to.be.false;
    });
    it('should remove all listeners and kill the tail process on close', function () {
        // given
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener(listener);
        log.close();
        // then
        expect(log.hasContentChangesListeners()).to.be.false;
        verify(tailProcess.kill('SIGKILL')).once();
    });
    it('should return size of log file content', async function () {
        // given
        const expectedSize = 15;
        const stats = new Stats();
        stats.size = expectedSize;
        when(fileSystem.statAsync(fileName)).thenResolve(stats);
        const log = factory.create(fileName);
        // when
        const size = await log.getContentSize();
        // then
        expect(size).to.equal(expectedSize);
    });
    it('should fail to read size of log file content', async function () {
        // given
        when(fileSystem.statAsync(fileName)).thenReject(new Error());
        const log = factory.create(fileName);
        // then
        await expect(log.getContentSize()).to.be.rejectedWith(ContentSizeError);
    });
    it('should fail to read content of the log file', async function () {
        // given
        when(fileSystem.readFileAsync(fileName)).thenReject(new Error());
        const log = factory.create(fileName);
        // then
        await expect(log.getContentAsString()).to.be.rejectedWith(ContentReadError);
    });
    it('should return content of the log file', async function () {
        // given
        const expectedContent = 'first line in a log file';
        when(fileSystem.readFileAsync(fileName)).thenResolve(expectedContent);
        const log = factory.create(fileName);
        // when
        const contentAsString = await log.getContentAsString();
        // then
        expect(contentAsString).to.equal(expectedContent);
    });
    it('should return text content of the log file in lines', async function () {
        // given
        const rawContent = `line1${EOL}line2${EOL}`;
        when(fileSystem.readFileAsync(fileName)).thenResolve(rawContent);
        const log = factory.create(fileName);
        // when
        const lines = await log.getContentLines();
        // then
        expect(lines).to.eql(['line1', 'line2']);
    });
    it('should notify listeners about content change, that is split in two incomplete chunks', function (done) {
        // given
        const expectedChange = 'line in a log file, that will get split' + EOL;
        when(tailProcess.stdout).thenReturn(createReadableToPushMessageInChunks(expectedChange));
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener((line) => {
            expect(line).to.equal(expectedChange.substring(0, expectedChange.length - 1));
            done();
        });
    });
    it('should notify listeners about content change on both STDOUT and STDERR', function (done) {
        // given
        const stdoutMessage = 'stdout message' + EOL;
        const stderrMessage = 'stderr message' + EOL;
        const receivedMessages: Array<string> = [];
        when(tailProcess.stdout).thenReturn(createReadableToPushMessageInChunks(stdoutMessage));
        when(tailProcess.stderr).thenReturn(createReadableToPushMessageInChunks(stderrMessage));
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener((line) => {
            receivedMessages.push(line);
            if (receivedMessages.length === 2) {
                expect(receivedMessages).to.eql([
                    stdoutMessage.substring(0, stdoutMessage.length - 1),
                    stderrMessage.substring(0, stderrMessage.length - 1)
                ]);
                done();
            }
        });
    });
});

function createReadableToPushMessageInChunks(message: string): Readable {
    const readable = new Readable();
    readable.push(message.substring(0, 5));
    readable.push(message.substring(5, message.length));
    readable.push(null);
    return readable;
}