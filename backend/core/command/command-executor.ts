import {Dictionary} from "typescript-collections";
import {Observable, Subscriber, throwError} from "rxjs";
import {Command, CommandError, CommandErrorCode} from "./command";
import {ArgumentError} from "common-errors";

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
            this.assertAllMandatoryArgsPresent(command.mandatoryArgs, args);
            await command.execute(output, args, input);
        } catch (e) {
            let code: number;
            if (e instanceof ArgumentError) {
                code = CommandErrorCode.argumentsError;
            } else if (e instanceof CommandError) {
                code = e.code;
            } else {
                code = CommandErrorCode.unknownError;
            }
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
            output.error(new CommandError(code, errorMessage.join('\n')));
        }
    }

    private assertAllMandatoryArgsPresent(mandatoryArgs: Array<string>, args: any): void {
        if (mandatoryArgs.length > 0) {
            if (!args) {
                throw new ArgumentError('args');
            }
            const missingMandatoryArgs: Array<string> = [];
            for (let mandatoryArg of mandatoryArgs) {
                if (args[mandatoryArg] === undefined) {
                    missingMandatoryArgs.push(mandatoryArg);
                }
            }
            if (missingMandatoryArgs.length > 0) {
                throw new ArgumentError(missingMandatoryArgs.join(', '));
            }
        }
    }
}
