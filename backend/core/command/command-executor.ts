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
            return throwError(`Can't find command with name '${commandName}'`);
        } else {
            return new Observable<any>(subscriber => {this.executeCommand(command, subscriber, args, input)});
        }
    }

    private async executeCommand(command: Command, output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        try {
            await command.execute(output, args, input);
        } catch (e) {
            output.error(e);
        }
    }
}
