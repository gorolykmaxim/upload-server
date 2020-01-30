/**
 * A log file, that can be watched by users of the "log-watcher" API.
 */
export class WatchableLog {

    /**
     * Construct a watchable log.
     *
     * @param absolutePath absolute path to the log file
     */
    constructor(public absolutePath: string) {
    }
}