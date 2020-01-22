import {DatabaseCollection, EntityMapping} from "../../common/collection/database-collection";
import { Database } from "sqlite";

/**
 * Mapping of absolute log file paths.
 */
export class AbsoluteLogFilePathMapping implements EntityMapping<string> {
    /**
     * {@inheritDoc}
     */
    deserialize(entity: any): string {
        return entity['ABSOLUTE_LOG_FILE_PATH'];
    }

    /**
     * {@inheritDoc}
     */
    serialize(entity: string): any {
        return {
            'ABSOLUTE_LOG_FILE_PATH': entity
        };
    }
}

/**
 * Collection of absolute log file paths, that are allowed to be watched.
 */
export class AllowedLogsCollection extends DatabaseCollection<string> {
    /**
     * Construct a collection.
     *
     * @param database database where the collection will store absolute log file paths
     */
    constructor(database: Database) {
        super(new AbsoluteLogFilePathMapping(), 'ALLOWED_LOG', database, 'ABSOLUTE_LOG_FILE_PATH');
    }
}