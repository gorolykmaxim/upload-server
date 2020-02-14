import {AllowedLogFilesRepository} from "./allowed-log-files-repository";

/**
 * Bounded context of a log-watcher, module, that allows reading information about log files, and watching changes
 * in them in the real time.
 */
export class LogWatcherBoundedContext {
    /**
     * Construct a bounded context.
     *
     * @param allowedLogFilesRepository repository, that stores paths to log files, that are allowed to be watched
     */
    constructor(private allowedLogFilesRepository: AllowedLogFilesRepository) {
    }

    /**
     * Get list of absolute paths to log files, that can be watched and information about which can be read.
     */
    getLogFilesAllowedToBeWatched(): Array<string> {
        return this.allowedLogFilesRepository.findAll();
    }
}
