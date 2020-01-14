import {Watcher} from "./watcher";
import {EntityComparison, InMemoryCollection} from "../../collection/in-memory-collection";

/**
 * Collection of watchers.
 */
export class WatcherCollection extends InMemoryCollection<Watcher> {
    /**
     * Construct a collection.
     */
    constructor() {
        super(new WatcherComparison());
    }
}

/**
 * Comparison of watchers and their IDs.
 */
export class WatcherComparison implements EntityComparison<Watcher> {
    /**
     * {@inheritDoc}
     */
    equal(entity: Watcher, anotherEntity: Watcher): boolean {
        return entity.id === anotherEntity.id;
    }

    /**
     * {@inheritDoc}
     */
    hasId(entity: Watcher, id: any): boolean {
        return entity.id === id;
    }

}