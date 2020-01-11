import {FileSystem, LogFileFactory} from "../../app/log-watcher/log";
import {instance, mock, spy, verify, when} from "ts-mockito";
import {CreateTail, Tail, UnixLogFileFactory} from "../../app/log-watcher/unix";
import {expect} from "chai";
import {Stats} from "fs";

const RealTail = require('nodejs-tail');

describe('UnixContent', function () {
    const fileName = 'error.log';
    const listener = () => {};
    let tail: Tail;
    let realTail: any;
    let factory: LogFileFactory;
    let fileSystem: FileSystem;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        realTail = new RealTail(fileName);
        tail = spy(realTail);
        when(tail.watch()).thenCall(listener);
        when(tail.close()).thenCall(listener);
        const createTail: CreateTail = () => realTail;
        factory = new UnixLogFileFactory(createTail, instance(fileSystem));
    });
    it('should start watching tail on log files creation', function () {
        // when
        factory.create(fileName);
        // then
        verify(tail.watch()).once();
    });
    it('should add change listener', function () {
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
    it('should remove all listeners and close tail', function () {
        // given
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener(listener);
        log.close();
        // then
        verify(tail.close()).once();
        expect(log.hasContentChangesListeners()).to.be.false;
    });
    it('should return size of log file content', async function () {
        // given
        const expectedSize = 82;
        const stats = new Stats();
        stats.size = expectedSize;
        when(fileSystem.statAsync(fileName)).thenResolve(stats);
        const log = factory.create(fileName);
        // when
        const size = await log.getContentSize();
        // then
        expect(size).to.equal(expectedSize);
    });
    it('should return content of the log file', async function () {
        // given
        const expectedContent = 'expected first line of the log file';
        when(fileSystem.readFileAsync(fileName)).thenResolve(expectedContent);
        const log = factory.create(fileName);
        // when
        const contentAsString = await log.getContentAsString();
        // then
        expect(contentAsString).to.equal(expectedContent);
    });
    it('should notify listeners about a log file change', function (done) {
        // given
        const expectedLine = 'expected log entry';
        const log = factory.create(fileName);
        // when
        log.addContentChangesListener((line) => {
            expect(line).to.equal(expectedLine);
            done();
        });
        realTail.emit('line', expectedLine);
    });
});