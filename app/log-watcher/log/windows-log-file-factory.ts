import {Content, ContentReadError, ContentSizeError, OnChange} from "./content";
import {EventEmitter} from "events";
import {ChildProcess} from "child_process";
import {FileSystem} from "./file-system";
import {TextContent} from "./text-content";
import {LogFileFactory} from "./log-file-factory";
import {LogFile} from "./log-file";
import {Stats} from "fs";
import {StringBuffer} from "../../common/string-buffer";
import {CreateChildProcess} from "../../common/child-process";

/**
 * Content of a log file in a Windows OS.
 */
class WindowsContent implements Content {
    private static readonly LINE_CHANGED = "line changed";
    private events: EventEmitter = new EventEmitter();
    private readonly stdoutBuffer: StringBuffer;
    private readonly stderrBuffer: StringBuffer;

    /**
     * Construct a log file content.
     *
     * @param absoluteLogFilePath absolute path to the log file, to which this contents belong to
     * @param tailProcess process of "tail", that will be used to track changes in this log file content
     * @param eol end-of-line separator used in this log file's content
     * @param fileSystem file system, where the content is located
     */
    constructor(private absoluteLogFilePath: string, private tailProcess: ChildProcess, private eol: string,
                private fileSystem: FileSystem) {
        this.stdoutBuffer = new StringBuffer(eol);
        this.stderrBuffer = new StringBuffer(eol);
        tailProcess.stdout.on('data', data => this.handleData(data.toString(), this.stdoutBuffer));
        tailProcess.stderr.on('data', data => this.handleData(data.toString(), this.stderrBuffer));
    }

    /**
     * {@inheritDoc}
     */
    addChangesListener(listener: OnChange): void {
        this.events.on(WindowsContent.LINE_CHANGED, listener);
    }

    /**
     * {@inheritDoc}
     */
    removeChangesListener(listener: OnChange): void {
        this.events.removeListener(WindowsContent.LINE_CHANGED, listener);
    }

    /**
     * {@inheritDoc}
     */
    hasChangesListeners(): boolean {
        return this.events.listenerCount(WindowsContent.LINE_CHANGED) > 0;
    }

    /**
     * {@inheritDoc}
     */
    close(): void {
        this.stderrBuffer.clear();
        this.stdoutBuffer.clear();
        this.events.removeAllListeners(WindowsContent.LINE_CHANGED);
        this.tailProcess.kill('SIGKILL');
    }

    /**
     * {@inheritDoc}
     */
    async getSize(): Promise<number> {
        try {
            const stats: Stats = await this.fileSystem.statAsync(this.absoluteLogFilePath);
            console.debug("%s returns it's size, and it is %i", this, stats.size);
            return stats.size;
        } catch (e) {
            throw new ContentSizeError(this.absoluteLogFilePath, e);
        }
    }

    /**
     * {@inheritDoc}
     */
    async readText(): Promise<TextContent> {
        try {
            const rawContent = await this.fileSystem.readFileAsync(this.absoluteLogFilePath);
            console.debug("%s returns its content as a string", this);
            return new TextContent(rawContent, this.eol);
        } catch (e) {
            throw new ContentReadError(this.absoluteLogFilePath, e);
        }
    }

    private handleData(data: string, buffer: StringBuffer): void {
        console.debug("%s has a new content change: '%s'. It will use buffer %s to handle it", this, data, buffer);
        const lines: Array<string> = buffer.readLines(data);
        lines.forEach(line => this.events.emit(WindowsContent.LINE_CHANGED, line));
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `WindowsContent{absoluteLogFilePath=${this.absoluteLogFilePath}, eol=${this.eol.charCodeAt(0)}, stdoutBuffer=${this.stdoutBuffer}, stderrBuffer=${this.stderrBuffer}}`;
    }
}

/**
 * Factory of log files in Windows OS.
 */
export class WindowsLogFileFactory implements LogFileFactory {
    /**
     * Construct a factory.
     *
     * @param tailBinaryPath path to "tail" binary, that will be used to track changes in windows' log files' content
     * @param eol end-of-line separator, used in windows' log files' content
     * @param childProcess factory-method, that will be used to start "tail" process
     * @param fileSystem file system where content of created log files is located
     */
    constructor(private tailBinaryPath: string, private eol: string, private childProcess: CreateChildProcess,
                private fileSystem: FileSystem) {
    }

    /**
     * {@inheritDoc}
     */
    create(fileName: string): LogFile {
        const tailProcess: ChildProcess = this.childProcess(this.tailBinaryPath, ['-f', fileName]);
        const content: Content = new WindowsContent(fileName, tailProcess, this.eol, this.fileSystem);
        return new LogFile(fileName, content);
    }
}