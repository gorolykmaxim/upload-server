import {TextContent} from "./text-content";

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