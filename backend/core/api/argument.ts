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
        switch (this.type) {
            case ArgumentType.string:
                this.assertValueOfType(value, String);
                break;
            case ArgumentType.number:
                this.assertValueOfType(value, Number);
                break;
            case ArgumentType.boolean:
                this.assertValueOfType(value, Boolean);
                break;
            case ArgumentType.array:
                this.assertValueOfType(value, Array);
                break;
            case ArgumentType.object:
                this.assertValueOfType(value, Object);
                break;
        }
    }

    private assertValueOfType(value: any, type: any): void {
        if (!(value instanceof type)) {
            throw new ArgumentError(`${this.name} is not of type ${type}`);
        }
    }
}

/**
 * Possible argument types
 */
export enum ArgumentType {
    number, string, boolean, object, array
}
