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
 * Simple generic collection of scalar values.
 */
export class ValuesCollection<T> implements Collection<T> {
    private values: Array<T> = [];

    /**
     * {@inheritDoc}
     */
    async add(item: T): Promise<void> {
        this.values.push(item);
    }

    /**
     * {@inheritDoc}
     */
    async contains(id: any): Promise<boolean> {
        return this.values.indexOf(id) >= 0;
    }

    /**
     * {@inheritDoc}
     */
    async findById(id: any): Promise<T> {
        const index = this.findIndexOf(id);
        return this.values[index];
    }

    /**
     * {@inheritDoc}
     */
    async remove(item: T): Promise<void> {
        const index = this.findIndexOf(item);
        this.values.splice(index, 1);
    }

    private findIndexOf(item: any): number {
        const index = this.values.indexOf(item);
        if (index < 0) {
            throw new EntityNotFoundError(item);
        }
        return index;
    }
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

/**
 * Failed to find entity in the collection.
 */
export class EntityNotFoundError extends CollectionError {
    /**
     * Construct an error.
     *
     * @param entity entity or ID of that entity
     */
    constructor(entity: any) {
        super(`Failed to find entity '${entity}' in collection`);
        Object.setPrototypeOf(this, EntityNotFoundError);
    }
}