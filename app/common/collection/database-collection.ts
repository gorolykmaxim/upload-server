import {Collection, CollectionError, EntityNotFoundError} from "./collection";
import { Database } from "sqlite";

/**
 * Mapping of an entity from a domain model to a persistence model.
 */
export interface EntityMapping<T> {
    /**
     * Create a persistence model for the specified domain model.
     *
     * @param entity domain model entity
     */
    serialize(entity: T): any;

    /**
     * Create a domain model from the specified persistence model.
     *
     * @param entity persistence model entity
     */
    deserialize(entity: any): T;
}

/**
 * A collection, that stores it's items in a database table.
 */
export class DatabaseCollection<T> implements Collection<T> {
    /**
     * Construct a collection.
     *
     * @param mapping a mapping of actual domain model entities to their table rows
     * @param tableName name of the table, where the collection will store entities
     * @param database database where the collection will store entities
     * @param idFieldName name of the field, which considered an ID of the entity. If you specify this parameter,
     * you can pass the value of this ID-field directly into contains() and findById(). Otherwise, you would need
     * to pass an object, that contains values of all the fields, that create an ID of an entity.
     */
    constructor(private mapping: EntityMapping<T>, private tableName: string, private database: Database,
                private idFieldName?: string) {
    }

    /**
     * {@inheritDoc}
     */
    async add(item: T): Promise<void> {
        try {
            const entity: any = this.mapping.serialize(item);
            const fields: Array<string> = [];
            const placeholders: Array<string> = [];
            const values: Array<any> = [];
            for (let key in entity) {
                if (entity.hasOwnProperty(key)) {
                    fields.push(key);
                    placeholders.push('?');
                    values.push(entity[key]);
                }
            }
            await this.database.run(`INSERT INTO ${this.tableName}(${fields.join(', ')}) VALUES (${placeholders.join(', ')})`, ...values);
        } catch (e) {
            throw new EntityAdditionError(item, e);
        }
    }

    /**
     * {@inheritDoc}
     */
    async contains(id: any): Promise<boolean> {
        try {
            await this.findById(id);
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
        try {
            return (await this.database.all(`SELECT * FROM ${this.tableName}`)).map(row => this.mapping.deserialize(row));
        } catch (e) {
            throw new EntityLookupError(e);
        }
    }

    /**
     * {@inheritDoc}
     */
    async findById(id: any): Promise<T> {
        try {
            const fields: Array<string> = [];
            const values: Array<string> = [];
            if (this.idFieldName) {
                fields.push(`${this.idFieldName} = ?`);
                values.push(id);
            } else {
                for (let key in id) {
                    if (id.hasOwnProperty(key)) {
                        fields.push(`${key} = ?`);
                        values.push(id[key]);
                    }
                }
            }
            const row: any = await this.database.get(`SELECT * FROM ${this.tableName} WHERE ${fields.join(' AND ')}`, ...values);
            if (!row) {
                throw new EntityNotFoundError(id);
            }
            return this.mapping.deserialize(row);
        } catch (e) {
            if (e instanceof EntityNotFoundError) {
                throw e;
            } else {
                throw new EntityLookupError(e, id);
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    async remove(item: T): Promise<void> {
        try {
            const entity: any = this.mapping.serialize(item);
            const fields: Array<string> = [];
            const values: Array<any> = [];
            for (let key in entity) {
                if (entity.hasOwnProperty(key)) {
                    fields.push(`${key} = ?`);
                    values.push(entity[key]);
                }
            }
            await this.database.run(`DELETE FROM ${this.tableName} WHERE ${fields.join(' AND ')}`, ...values);
        } catch (e) {
            throw new EntityRemovalError(item, e);
        }
    }
}

/**
 * Failed to add an entity to a database collection.
 */
export class EntityAdditionError extends CollectionError {
    /**
     * Construct an error.
     *
     * @param item item that was not added to a collection
     * @param cause reason of the error
     */
    constructor(item: any, cause: Error) {
        super(`Failed to add ${item} to a collection. Reason: ${cause}`);
        Object.setPrototypeOf(this, EntityAdditionError.prototype);
    }
}

/**
 * Failed to remove an entity from a database collection.
 */
export class EntityRemovalError extends CollectionError {
    /**
     * Construct an error.
     *
     * @param item item that was not removed from a collection
     * @param cause reason of the error
     */
    constructor(item: any, cause: Error) {
        super(`Failed to remove ${item} from a collection. Reason: ${cause}`);
        Object.setPrototypeOf(this, EntityRemovalError.prototype);
    }
}

/**
 * Failed to find an entity in a database collection.
 */
export class EntityLookupError extends CollectionError {
    /**
     * Construct an error.
     *
     * @param cause reason of the error
     * @param id ID of the item, that was being looked-up. Will not be specified in case of a findAll().
     */
    constructor(cause: Error, id?: any) {
        const messagePart: string = id ? `entity with ID ${id}` : `all entities`;
        super(`Failed to find ${messagePart} in a collection. Reason: ${cause}`);
        Object.setPrototypeOf(this, EntityLookupError.prototype);
    }
}