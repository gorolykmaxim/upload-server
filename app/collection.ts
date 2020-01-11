/**
 * Collection of entities.
 */
export interface Collection<T> {
    /**
     * Find entity with the specified ID and return it. If there is no entity, matching the search criteria - throw
     * {@link CollectionError}.
     *
     * @param id ID of the entity
     */
    findById(id: any): Promise<T>;

    /**
     * Check if entity with the specified ID is contained by this collection.
     *
     * @param id ID of the entity
     */
    contains(id: any): Promise<boolean>;

    /**
     * Add specified entity to the collection. If this operation fails for some reason - throw {@link CollectionError}.
     *
     * @param item item to add
     */
    add(item: T): Promise<void>;

    /**
     * Remove specified entity from this collection. If the specified entity does not belong to the collection -
     * throw {@link CollectionError}.
     *
     * @param item item to remove
     */
    remove(item: T): Promise<void>;
}

/**
 * A generic collection-related error.
 */
export class CollectionError extends Error {
    /**
     * Construct an error.
     *
     * @param message message of the error
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, CollectionError);
    }
}