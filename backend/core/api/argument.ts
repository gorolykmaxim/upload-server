/**
 * Data structure that represents a single argument of an API entity (request or a message).
 */
export interface Argument {
    /**
     * Name of the argument.
     */
    readonly name: string;
    /**
     * Expected type of the argument.
     */
    readonly type: ArgumentType;
}

/**
 * Possible argument types
 */
export enum ArgumentType {
    number, string, boolean, object, array
}
