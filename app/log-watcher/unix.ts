import {Content, FileSystem, LogFile, LogFileFactory} from "./log";
import {EventEmitter} from "events";

/**
 * Interface of a nodejs-tail.
 */
export interface Tail extends EventEmitter {
    /**
     * Start watching changes in the file, being tailed.
     */
    watch(): void;

    /**
     * Stop watching changes in the file, being tailed.
     */
    close(): void;
}

/**
 * Content of a log file in any kind of Unix OS.
 */
class UnixContent implements Content {
    private static readonly LINE_CHANGED = 'line';

    /**
     * Construct a log file content.
     *
     * @param absoluteLogFilePath absolute path to the log file, to which the content belongs to
     * @param tail tail, that will be used to track changes in the log file's content
     * @param fileSystem file system, that contains the content of the log file
     */
    constructor(private absoluteLogFilePath: string, private tail: Tail, private fileSystem: FileSystem) {
    }

    /**
     * {@inheritDoc}
     */
    addChangesListener(listener: (data: string) => void): void {
        this.tail.on(UnixContent.LINE_CHANGED, listener);
    }

    /**
     * {@inheritDoc}
     */
    close(): void {
        this.tail.removeAllListeners();
        this.tail.close();
    }

    /**
     * {@inheritDoc}
     */
    async getSize(): Promise<number> {
        return (await this.fileSystem.statAsync(this.absoluteLogFilePath)).size;
    }

    /**
     * {@inheritDoc}
     */
    hasChangesListeners(): boolean {
        return this.tail.listenerCount(UnixContent.LINE_CHANGED) > 0;
    }

    /**
     * {@inheritDoc}
     */
    async read(): Promise<string> {
        return (await this.fileSystem.readFileAsync(this.absoluteLogFilePath)).toString();
    }

    /**
     * {@inheritDoc}
     */
    removeChangesListener(listener: (data: string) => void): void {
        this.tail.removeListener(UnixContent.LINE_CHANGED, listener);
    }
}


export type CreateTail = () => Tail;

/**
 * Factory of log files on any kind of Unix OS.
 */
export class UnixLogFileFactory implements LogFileFactory {

    /**
     * Construct a factory.
     *
     * @param tail factor-method, that will be used to create a tail to track changes in log file's content
     * @param fileSystem file system where content of created log files is located
     */
    constructor(private tail: CreateTail, private fileSystem: FileSystem) {
    }

    /**
     * {@inheritDoc}
     */
    create(absoluteLogFilePath: string): LogFile {
        const tail = this.tail();
        tail.watch();
        const content: Content = new UnixContent(absoluteLogFilePath, tail, this.fileSystem);
        return new LogFile(absoluteLogFilePath, content);
    }
}