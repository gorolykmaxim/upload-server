import {LogFile} from "./log-file";
import {EntityComparison, InMemoryCollection} from "../../collection/in-memory-collection";

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