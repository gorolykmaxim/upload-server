import {ArgumentError} from "common-errors";

/**
 * Data structure that represents a single argument of an API entity (request or a message).
 */
export class Argument {
    /**
     * Construct an argument.
     *
     * @param name name of the argument
     * @param type expected argument type
     */
    constructor(readonly name: string, private type: ArgumentType) {
    }

    /**
     * Verify that the specified value corresponds to this argument. If it does not - throw an error.
     *
     * @param value value to verify
     */
    verifyValue(value: any): void {
        if (typeof value != this.type) {
            throw new ArgumentError(`${this.name} is not of type ${this.type}`);
        }
    }
}

/**
 * Possible argument types
 */
export enum ArgumentType {
    number = 'number',
    string = 'string',
    boolean = 'boolean',
    object = 'object'
}
