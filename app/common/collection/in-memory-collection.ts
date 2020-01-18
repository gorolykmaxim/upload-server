import {Collection, EntityNotFoundError} from "./collection";

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
    async findAll(): Promise<Array<T>> {
        return Object.assign([], this.entities);
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