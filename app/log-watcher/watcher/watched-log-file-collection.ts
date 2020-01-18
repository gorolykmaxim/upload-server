import {EntityComparison, InMemoryCollection} from "../../common/collection/in-memory-collection";
import {WatchedLogFile} from "./watched-log-file";

/**
 * Comparision of watcher log files and their absolute paths.
 */
export class WatchedLogFileComparison implements EntityComparison<WatchedLogFile> {
    /**
     * {@inheritDoc}
     */
    equal(entity: WatchedLogFile, anotherEntity: WatchedLogFile): boolean {
        return entity.logFile.absolutePath === anotherEntity.logFile.absolutePath;
    }

    /**
     * {@inheritDoc}
     */
    hasId(entity: WatchedLogFile, id: any): boolean {
        return entity.logFile.absolutePath == id;
    }

}

/**
 * Collection of watched log files.
 */
export class WatchedLogFileCollection extends InMemoryCollection<WatchedLogFile> {
    /**
     * Construct a collection.
     */
    constructor() {
        super(new WatchedLogFileComparison());
    }
}