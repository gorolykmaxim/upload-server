import {Collection, EntityNotFoundError} from "./collection";

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
    async findAll(): Promise<Array<T>> {
        return Object.assign([], this.values);
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