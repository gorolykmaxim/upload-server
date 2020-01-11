import {Stats} from "fs";
import {Collection, EntityNotFoundError} from "../collection";

/**
 * Callback, that gets called when contents of a log files got changed.
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
        return `LogFile{absolutePath=${this.absolutePath}`;
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
export class LogFileCollection implements Collection<LogFile> {
    private logFiles: Array<LogFile> = [];

    /**
     * {@inheritDoc}
     */
    async add(item: LogFile): Promise<void> {
        this.logFiles.push(item);
    }

    /**
     * {@inheritDoc}
     */
    async findById(id: any): Promise<LogFile> {
        const index = this.findIndexOf(id);
        return this.logFiles[index];
    }

    /**
     * {@inheritDoc}
     */
    async remove(item: LogFile): Promise<void> {
        const index = this.findIndexOf(item);
        this.logFiles.splice(index, 1);
    }

    /**
     * {@inheritDoc}
     */
    async contains(id: any): Promise<boolean> {
        try {
            this.findIndexOf(id);
            return true;
        } catch (e) {
            return false;
        }
    }

    private findIndexOf(item: LogFile | string): number {
        for (let i = 0; i < this.logFiles.length; i++) {
            if (this.logFiles[i].absolutePath === (item instanceof LogFile ? item.absolutePath : item)) {
                return i;
            }
        }
        throw new EntityNotFoundError(item);
    }
}