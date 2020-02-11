import {Dictionary} from "typescript-collections";
import {Observable, Subscriber, throwError} from "rxjs";
import {Command} from "./command";

/**
 * Executor of commands. Keeps track of all registered commands and provides the means to execute them.
 */
export class CommandExecutor {
    private nameToCommand: Dictionary<string, Command> = new Dictionary<string, Command>();

    /**
     * Register a command, that can be executed.
     *
     * @param commandName name by which the command may be referenced
     * @param command actual command
     */
    register(commandName: string, command: Command): void {
        this.nameToCommand.setValue(commandName, command);
        command.setExecutor(this);
    }

    /**
     * Execute a command, referenced by the specified name.
     *
     * @param commandName name of the command to execute
     * @param args optional named arguments to pass to the command
     * @param input optional input observable to pass to the command
     */
    execute(commandName: string, args?: any, input?: Observable<any>): Observable<any> {
        const command: Command = this.nameToCommand.getValue(commandName);
        if (!command) {
            return throwError(new Error(`Can't find command with name '${commandName}'`));
        } else {
            return new Observable<any>(subscriber => {this.executeCommand(commandName, command, subscriber, args, input)});
        }
    }

    private async executeCommand(commandName: string, command: Command, output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        try {
            if (command.argsType && !(args instanceof command.argsType)) {
                throw new ArgumentTypeError(commandName, command);
            }
            await command.execute(output, args, input);
        } catch (e) {
            const errorMessage: Array<string> = [
                `Failed to ${commandName}. Reason: ${e.message}.`,
                `Implementation - ${command.constructor.name}`
            ];
            if (args) {
                errorMessage.push(`Arguments: ${JSON.stringify(args)}`);
            }
            if (input) {
                errorMessage.push(`Input is supplied`);
            }
            output.error(new Error(errorMessage.join('\n')));
        }
    }
}

/**
 * Arguments of an incorrect type where supplied to a command, that expects them in a different type.
 */
export class ArgumentTypeError extends Error {
    /**
     * Construct an error.
     *
     * @param commandName name of the command
     * @param command actual command
     */
    constructor(commandName: string, command: Command) {
        super(`Command "${commandName}" [${command.constructor.name}] expects it's arguments to be of ${command.argsType} type.`);
        Object.setPrototypeOf(this, ArgumentTypeError.prototype);
    }
}
