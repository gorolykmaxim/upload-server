import {Stats} from "fs";
import {Collection, EntityComparison, EntityNotFoundError, InMemoryCollection} from "../collection";

/**
 * Callback, that gets called when a new line gets added to contents of the log file.
 *
 * @param data change in the contents
 */
export type OnChange = (data: string) => void;

/**
 * Content of a log file.
 */
export interface Content {
    /**
     * Specify a listener, that will be notified each time this log file content changes.
     *
     * @param listener callback to call on log file content change
     */
    addChangesListener(listener: OnChange): void;

    /**
     * Remove specified listener from the list of listeners, that should be notified about changes in this log file
     * content.
     *
     * @param listener listener to remove
     */
    removeChangesListener(listener: OnChange): void;

    /**
     * Return true if changes in this log file content are being listened to right now.
     */
    hasChangesListeners(): boolean;

    /**
     * Get size of the log file content in bytes.
     */
    getSize(): Promise<number>;

    /**
     * Return text contents of the log file.
     */
    readText(): Promise<TextContent>;

    /**
     * Stop listening for changes in this content.
     */
    close(): void;
}

/**
 * Content of a text log file.
 */
export class TextContent {
    public content: string;

    /**
     * Construct content.
     *
     * @param rawContent raw content of a text file, that may be a string or a buffer
     * @param eol end-of-line separator used in this content
     */
    constructor(rawContent: any, private eol: string) {
        this.content = rawContent.toString();
    }

    /**
     * Return all the lines of the text content.
     */
    getLines(): Array<string> {
        const lines = this.content.split(this.eol);
        const indexOfLastLine = lines.length - 1;
        if (lines[indexOfLastLine] === '') {
            lines.splice(indexOfLastLine, 1);
        }
        return lines;
    }
}

/**
 * A log file, changes in which can be listened to.
 */
export class LogFile {
    /**
     * Construct a log file.
     *
     * @param absolutePath absolute path to the log file
     * @param content content of the log file
     */
    constructor(public absolutePath: string, private content: Content) {
    }

    /**
     * Specify listener, that will be called each time contents of this log files change.
     *
     * @param listener callback to call on log file content change
     */
    addContentChangesListener(listener: OnChange): void {
        this.content.addChangesListener(listener);
    }

    /**
     * Remove specified listener from the list of listeners, that should be notified about changes in content of this
     * log file.
     *
     * @param listener listener to remove
     */
    removeContentChangesListener(listener: OnChange): void {
        this.content.removeChangesListener(listener);
    }

    /**
     * Return true if changes in the content of this log file are being listened to right now.
     */
    hasContentChangesListeners(): boolean {
        return this.content.hasChangesListeners();
    }

    /**
     * Get size of this log file contents in bytes.
     */
    getContentSize(): Promise<number> {
        return this.content.getSize();
    }

    /**
     * Return all content of the log file as a string.
     */
    async getContentAsString(): Promise<string> {
        const textContent = await this.content.readText();
        return textContent.content;
    }

    /**
     * Return content of the log file as an array of it's string lines.
     */
    async getContentLines(): Promise<Array<string>> {
        const textContent = await this.content.readText();
        return textContent.getLines();
    }

    /**
     * Stop listening for changes in this log file.
     */
    close() {
        this.content.close();
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return `LogFile{absolutePath=${this.absolutePath}}`;
    }
}

/**
 * Factory of {@link LogFile}.
 */
export interface LogFileFactory {
    /**
     * Create a log file.
     *
     * @param absoluteLogFilePath absolute path to the created log file
     */
    create(absoluteLogFilePath: string): LogFile;
}

/**
 * A file system, on which log files are located.
 */
export interface FileSystem {
    /**
     * Get stat attributes of a file, located by the specified path.
     *
     * @param path absolute path to the file
     * @param options additional options
     */
    statAsync(path: string, options?: any): Promise<Stats>;

    /**
     * Read a file, located by the specified path, and return it's contents
     * as a string.
     *
     * @param path absolute path to the file
     * @param options additional options
     */
    readFileAsync(path: string, options?: any): Promise<string>;
}

/**
 * An attempt was made to create a log file, access to which is prohibited by {@link RestrictedLogFileFactory}.
 */
export class LogFileAccessError extends Error {
    /**
     * Construct an error.
     *
     * @param absoluteLogFilePath absolute path to the log file, that has been attempted to be created
     */
    constructor(absoluteLogFilePath: string) {
        super(`Access to '${absoluteLogFilePath}' is prohibited`);
        Object.setPrototypeOf(this, LogFileAccessError.prototype);
    }
}

/**
 * Log file factory, that restrict access to log files and only allows to create those log files, that were
 * explicitly allowed to be created.
 */
export class RestrictedLogFileFactory implements LogFileFactory {
    /**
     * Construct a factory.
     *
     * @param factory a log file factory, to which this factory will delegate log file construction
     * @param allowedLogFilePaths collection of absolute paths to log files, that are permitted to be created
     */
    constructor(private factory: LogFileFactory, private allowedLogFilePaths: Set<string> = new Set()) {
    }

    /**
     * {@inheritDoc}
     */
    create(fileName: string): LogFile {
        if (!this.allowedLogFilePaths.has(fileName)) {
            throw new LogFileAccessError(fileName);
        }
        return this.factory.create(fileName);
    }
}

/**
 * Collection of log files.
 */
export class LogFileCollection extends InMemoryCollection<LogFile> {
    /**
     * Construct a collection.
     */
    constructor() {
        super(new LogFileComparison());
    }
}

/**
 * Comparison of log files and their absolute paths.
 */
export class LogFileComparison implements EntityComparison<LogFile> {

    /**
     * {@inheritDoc}
     */
    equal(entity: LogFile, anotherEntity: LogFile): boolean {
        return entity.absolutePath === anotherEntity.absolutePath;
    }

    /**
     * {@inheritDoc}
     */
    hasId(entity: LogFile, id: any): boolean {
        return entity.absolutePath === id;
    }
}

/**
 * Generic error, that might happen while trying to read log file content or it's properties.
 */
export class ContentError extends Error {
    /**
     * Construct an error.
     *
     * @param message message of the error
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ContentError.prototype);
    }
}

/**
 * Failed to read content of a log file.
 */
export class ContentReadError extends ContentError {
    /**
     * Construct an error.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason of the failure
     */
    constructor(absoluteLogFilePath: string, cause: Error) {
        super(`Failed to read content of ${absoluteLogFilePath}. Reason: ${cause}`);
        Object.setPrototypeOf(this, ContentReadError.prototype);
    }
}

/**
 * Failed to read size of the log file's content.
 */
export class ContentSizeError extends ContentError {
    /**
     * Construct an error.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason fo the failure
     */
    constructor(absoluteLogFilePath: string, cause: Error) {
        super(`Failed to read size of ${absoluteLogFilePath}. Reason: ${cause}`);
        Object.setPrototypeOf(this, ContentSizeError.prototype);
    }
}

/**
 * Pool of log files, that are currently being watched by somebody.
 * Depending on a situation, creating a log file instance might be expensive, so log file instances
 * are re-used across different watchers, meaning a single log file can be watched by multiple watchers at the same
 * time.
 */
export class LogFilePool {
    /**
     * Construct a log file pool.
     *
     * @param logFiles collection, where the pool will store re-usable log files
     * @param factory factory, using which the pool will create new log files
     */
    constructor(private logFiles: Collection<LogFile>, private factory: LogFileFactory) {
    }

    /**
     * Return instance of a log file, located by the specified path.
     * If the pool does not have such log file - it will create a new one. If the pool already has a fitting
     * log file instance - it will return it instead.
     *
     * @param absoluteLogFilePath absolute path to the log file
     */
    async getLog(absoluteLogFilePath: string): Promise<LogFile> {
        let logFile: LogFile;
        if (await this.logFiles.contains(absoluteLogFilePath)) {
            logFile = await this.logFiles.findById(absoluteLogFilePath);
        } else {
            logFile = this.factory.create(absoluteLogFilePath);
            await this.logFiles.add(logFile);
        }
        return logFile;
    }

    /**
     * Remove all of the specified log files, that have no active watchers and can be freed, from the pool, while
     * disposing all the associated resources.
     *
     * @param logFiles log files to try to dispose
     */
    async disposeAllIfNecessary(logFiles: Array<LogFile>): Promise<void> {
        await Promise.all(logFiles.map(this.disposeIfNecessary.bind(this)));
    }

    /**
     * Close the specified log file if it has no active watchers. If the log file has active watcher - this method
     * call will be ignored.
     * Only log files, that belong to this pool, can be disposed by this pool.
     *
     * @param logFile log file to try to dispose
     */
    async disposeIfNecessary(logFile: LogFile): Promise<void> {
        try {
            if (!logFile.hasContentChangesListeners()) {
                await this.logFiles.remove(logFile);
                logFile.close();
            }
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                e = new LogFileDoesNotBelongToThePoolError(logFile);
            }
            throw new LogFileCantBeDisposedError(logFile, e);
        }
    }
}

/**
 * Generic log file pool error.
 */
export class LogFilePoolError extends Error {
    /**
     * Construct an error.
     *
     * @param message error message
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, LogFilePool.prototype);
    }
}

/**
 * Specified log file does not belong to the pool, that has thrown this error.
 */
export class LogFileDoesNotBelongToThePoolError extends LogFilePoolError {
    /**
     * Construct an error.
     *
     * @param logFile log file, that does not belong to the pool
     */
    constructor(logFile: LogFile) {
        super(`${logFile} does not belong to the pool.`);
        Object.setPrototypeOf(this, LogFileDoesNotBelongToThePoolError.prototype);
    }
}

/**
 * Specified log file can't be disposed by the pool, that has thrown this error.
 */
export class LogFileCantBeDisposedError extends LogFilePoolError {
    /**
     * Construct an error.
     *
     * @param logFile log file, that was not disposed
     * @param cause reason why the file was not disposed
     */
    constructor(logFile: LogFile, cause: Error) {
        super(`${logFile} can't be disposed by the pool. Reason: ${cause}`);
        Object.setPrototypeOf(this, LogFileCantBeDisposedError.prototype);
    }
}