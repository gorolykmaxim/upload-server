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
     * Return contents of the log file as a string.
     */
    read(): Promise<string>;

    /**
     * Stop listening for changes in this content.
     */
    close(): void;
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
    getContentAsString(): Promise<string> {
        return this.content.read();
    }

    /**
     * Stop listening for changes in this log file.
     */
    close() {
        this.content.close();
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