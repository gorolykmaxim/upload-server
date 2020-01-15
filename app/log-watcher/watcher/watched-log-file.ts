import {LogFile} from "../log/log-file";
import {OnChange} from "../log/content";

/**
 * A log file, that is being watched by a watcher.
 * The only reason this thing exists is that when a watcher starts listening to changes in a log file's content,
 * the watcher has to memorize the function, that he passed the log file: when the watcher will stop listening
 * to changes, he will try to remove his listener from the log file and he would have to pass exactly the same
 * function in order for this to work (due to how function comparision is implemented in EventEmitter and in JS
 * in general).
 */
export class WatchedLogFile {
    /**
     * Construct a watched log file.
     *
     * @param logFile log file, that is being watched
     * @param listener function, used by the watcher, to watch for changes in the specified log file
     */
    constructor(public readonly logFile: LogFile, public readonly listener: OnChange) {
    }
}