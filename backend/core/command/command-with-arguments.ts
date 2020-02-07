import {Observable, Subscriber} from "rxjs";
import {ArgumentError} from "common-errors";
import {Command} from "./command";

/**
 * Proxy to the actual command, that checks if the arguments, mandated by the actual command, are specified.
 */
export class CommandWithArguments extends Command {
    /**
     * Construct a command.
     *
     * @param command actual command, that has mandatory arguments
     */
    constructor(private command: Command & ArgumentsConsumer) {
        super();
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        if (this.command.mandatoryArgs.length > 0) {
            if (!args) {
                throw new ArgumentError('args');
            }
            const missingMandatoryArgs: Array<string> = [];
            for (let mandatoryArg of this.command.mandatoryArgs) {
                if (args[mandatoryArg] === undefined) {
                    missingMandatoryArgs.push(mandatoryArg);
                }
            }
            if (missingMandatoryArgs.length > 0) {
                throw new ArgumentError(missingMandatoryArgs.join(', '));
            }
        }
        await this.command.execute(output, args, input);
    }
}

/**
 * A command, that has mandatory arguments.
 */
export interface ArgumentsConsumer {
    /**
     * Array of mandatory argument names.
     */
    readonly mandatoryArgs: Array<string>;
}
