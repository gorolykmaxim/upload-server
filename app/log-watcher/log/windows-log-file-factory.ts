import {Content, ContentReadError, ContentSizeError, OnChange} from "./content";
import {EventEmitter} from "events";
import {ChildProcess} from "child_process";
import {FileSystem} from "./file-system";
import {TextContent} from "./text-content";
import {LogFileFactory} from "./log-file-factory";
import {LogFile} from "./log-file";
import {Stats} from "fs";

class Buffer {
    private data: string = null;
    write(data: string): void {
        this.data = data;
    }
    read(): string {
        return this.data;
    }
    isEmpty(): boolean {
        return  this.data === null;
    }
    clear(): void {
        this.data = null;
    }
    toString() {
        return `Buffer{data=${this.data}}`;
    }
}

/**
 * Content of a log file in a Windows OS.
 */
class WindowsContent implements Content {
    private static readonly LINE_CHANGED = "line changed";
    private events: EventEmitter = new EventEmitter();
    private stdoutBuffer: Buffer = new Buffer();
    private stderrBuffer: Buffer = new Buffer();

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

    private handleData(data: string, buffer: Buffer): void {
        console.debug("%s has a new content change: '%s'. It will use buffer %s to handle it", this, data, buffer);
        if (!buffer.isEmpty()) {
            // Non-empty buffer means, that last chunk of content, had last line
            // interrupted. This means that the first line of current chunk is the continuation of that line.
            data = buffer.read() + data;
        }
        const lines: Array<string> = data.split(this.eol);
        const lastLine: string = lines.pop();
        if (lastLine !== '') {
            // We've just split a string by line-ending delimiter. That string didn't end with a line-ending symbol,
            // it means that line was not complete. We will not emit that line and save it until next time, since next
            // time we will receive the rest of that line.
            buffer.write(lastLine);
        }
        lines.forEach(line => this.events.emit(WindowsContent.LINE_CHANGED, line));
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `WindowsContent{absoluteLogFilePath=${this.absoluteLogFilePath}, eol=${this.eol.charCodeAt(0)}, stdoutBuffer=${this.stdoutBuffer}, stderrBuffer=${this.stderrBuffer}}`;
    }
}

export type CreateChildProcess = (binaryPath: string, args: Array<string>) => ChildProcess;

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