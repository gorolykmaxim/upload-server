import {ChildProcess, MessageOptions, SendHandle} from "child_process";
import {CloseEvent, Process} from "../../../backend/core/process/base";
import {expect} from "chai";
import {EventEmitter} from "events";
import {Readable, Writable} from "stream";
import * as net from "net";

class DummyReadable extends Readable {
    _read(size: number): void {}
}

export class DummyChildProcess extends EventEmitter implements ChildProcess {
    constructor(pid?: number) {
        super();
        this.pid = pid;
    }
    readonly connected: boolean;
    readonly killed: boolean;
    readonly pid: number;
    stderr: Readable | null = new DummyReadable();
    stdin: Writable | null;
    readonly stdio: [(Writable | null), (Readable | null), (Readable | null), (Readable | Writable | null | undefined), (Readable | Writable | null | undefined)];
    stdout: Readable | null = new DummyReadable();

    disconnect(): void {
    }

    kill(signal?: "SIGABRT" | "SIGALRM" | "SIGBUS" | "SIGCHLD" | "SIGCONT" | "SIGFPE" | "SIGHUP" | "SIGILL" | "SIGINT" | "SIGIO" | "SIGIOT" | "SIGKILL" | "SIGPIPE" | "SIGPOLL" | "SIGPROF" | "SIGPWR" | "SIGQUIT" | "SIGSEGV" | "SIGSTKFLT" | "SIGSTOP" | "SIGSYS" | "SIGTERM" | "SIGTRAP" | "SIGTSTP" | "SIGTTIN" | "SIGTTOU" | "SIGUNUSED" | "SIGURG" | "SIGUSR1" | "SIGUSR2" | "SIGVTALRM" | "SIGWINCH" | "SIGXCPU" | "SIGXFSZ" | "SIGBREAK" | "SIGLOST" | "SIGINFO" | number): void {
    }

    ref(): void {
    }

    unref(): void {
    }

    send(message: string | object | number | boolean, callback?: (error: (Error | null)) => void): boolean;
    send(message: string | object | number | boolean, sendHandle?: net.Socket | net.Server, callback?: (error: (Error | null)) => void): boolean;
    send(message: string | object | number | boolean, sendHandle?: net.Socket | net.Server, options?: MessageOptions, callback?: (error: (Error | null)) => void): boolean;
    send(message: string | object | number | boolean, callback1?: ((error: (Error | null)) => void) | SendHandle, callback2?: ((error: (Error | null)) => void) | MessageOptions, callback3?: (error: (Error | null)) => void): boolean {
        return false;
    }

}

describe('Process', function () {
    let childProcess: ChildProcess;
    let process: Process;
    beforeEach(function () {
        childProcess = new DummyChildProcess();
        process = new Process(childProcess);
    });
    it('should complete close observable after the first event', function (done) {
        // given
        const expectedEvent: CloseEvent = {code: 0, signal: null};
        // when
        process.close.subscribe(e => expect(e).eql(expectedEvent), e => {}, done);
        childProcess.emit('close', expectedEvent.code, expectedEvent.signal);
    });
    it('should complete error observable after the first event', function (done) {
        // given
        const expectedError: Error = new Error();
        // when
        process.error.subscribe(e => expect(e).equal(expectedError), e => {}, done);
        childProcess.emit('error', expectedError);
    });
    it('should complete stdoutData observable after close event', function (done) {
        // when
        process.stdoutData.subscribe(() => {}, () => {}, done);
        childProcess.emit('close', 0);
    });
    it('should complete stdoutData observable after error event', function (done) {
        // when
        process.stdoutData.subscribe(() => {}, () => {}, done);
        childProcess.emit('error', new Error());
    });
    it('should complete stderrData observable after close event', function (done) {
        // when
        process.stderrData.subscribe(() => {}, () => {}, done);
        childProcess.emit('close', 0);
    });
    it('should complete stderrData observable after error event', function (done) {
        // when
        process.stderrData.subscribe(() => {}, () => {}, done);
        childProcess.emit('error', new Error());
    });
    it('should complete closeOrError after close event', function (done) {
        // when
        process.closeOrError.subscribe(() => {}, () => {}, done);
        childProcess.emit('close', 0);
    });
    it('should complete closeOrError after error event', function (done) {
        // when
        process.closeOrError.subscribe(() => {}, () => {}, done);
        childProcess.emit('error', new Error());
    });
});
