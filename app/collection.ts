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
 * Collection of entities, that stores them in memory.
 */
export class InMemoryCollection<T> implements Collection<T> {
    private entities: Array<T> = [];
    /**
     * Construct a collection.
     *
     * @param comparison comparison, that will be used to compare entities and their IDs to look for entities in the
     * collection
     */
    constructor(private comparison: EntityComparison<T>) {
    }

    /**
     * {@inheritDoc}
     */
    async add(item: T): Promise<void> {
        this.entities.push(item);
    }

    /**
     * {@inheritDoc}
     */
    async contains(id: any): Promise<boolean> {
        try {
            this.findIndexOfId(id);
            return true;
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                return false;
            } else {
                throw e;
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    async findById(id: any): Promise<T> {
        const index = this.findIndexOfId(id);
        return this.entities[index];
    }

    /**
     * {@inheritDoc}
     */
    async remove(item: T): Promise<void> {
        const index = this.findIndexOfItem(item);
        this.entities.splice(index, 1);
    }

    private findIndexOfId(id: any): number {
        return this.findIndexOf(e => this.comparison.hasId(e, id), id);
    }
    private findIndexOfItem(item: T): number {
        return this.findIndexOf(e => this.comparison.equal(e, item), item);
    }
    private findIndexOf(predicate: (e: T) => boolean, entity: any): number {
        const index = this.entities.findIndex(predicate);
        if (index < 0) {
            throw new EntityNotFoundError(entity);
        }
        return index;
    }
}

/**
 * Comparison of two entities.
 */
export interface EntityComparison<T> {
    /**
     * Return true if both entities are the same.
     *
     * @param entity one entity
     * @param anotherEntity another entity
     */
    equal(entity: T, anotherEntity: T): boolean;

    /**
     * Return true if specified entity has the specified ID.
     *
     * @param entity entity to check
     * @param id ID of the entity
     */
    hasId(entity: T, id: any): boolean;
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
        Object.setPrototypeOf(this, CollectionError.prototype);
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
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
    }
}