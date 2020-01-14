import {Content, OnChange} from "./content";

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