import {ArgumentError} from "common-errors";

/**
 * Arguments of some operation, some of which are mandatory.
 */
export class Arguments {
    /**
     * Construct arguments from the specified object, while checking if all of the
     * expected arguments are present.
     *
     * @param args actual arguments
     * @param expectedArguments names of the mandatory arguments
     */
    constructor(private args: any, expectedArguments: Array<string>) {
        const missingArguments: Array<string> = expectedArguments.filter(a => !(a in args));
        if (missingArguments.length > 0) {
            throw new ArgumentError(missingArguments.join(', '));
        }
    }

    /**
     * Get value of the specified argument.
     *
     * @param argumentName name of the argument
     */
    get(argumentName: string): any {
        return this.args[argumentName];
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `Arguments{args=${JSON.stringify(this.args)}}`;
    }
}