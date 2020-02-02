import {Observable, Subject, throwError} from "rxjs";
import {Dictionary} from "typescript-collections";

/**
 * The base building block of the upload-server application.
 *
 * Every bit of functionality is implemented as a command. Commands do not reference each other directly but schedule
 * executions of each other.
 */
export abstract class Command {
    private executor: CommandExecutor;

    /**
     * Specify the executor, using which this command can schedule executions of other commands.
     *
     * @param executor command executor
     */
    setExecutor(executor: CommandExecutor): void {
        this.executor = executor;
    }

    /**
     * Schedule execution of the command with the specified name. The target command is not guaranteed to be executed
     * immediately.
     *
     * @param commandName name of the command to execute
     * @param args named arguments to be passed to the specified command
     * @param input observable of data, that can be piped to the target command. If the target command supports it - it
     * can listen to the input and react to it.
     */
    schedule(commandName: string, args?: any, input?: Observable<any>): Observable<any> {
        return this.executor.execute(commandName, args, input);
    }

    /**
     * Execute this command. Never call this method directly. Execute a command either using the schedule() or directly
     * calling the command executor's executeCommand().
     *
     * @param output subject, to which the output of this command should be published. Closing it manually is not
     * mandatory
     * @param args optional named arguments
     * @param input optional observable of data, this command can listen to
     */
    async abstract execute(output: Subject<any>, args?: any, input?: Observable<any>): Promise<void>;
}

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
            const output: Subject<any> = new Subject<any>();
            this.executeCommand(command, output, args, input);
            return output;
        }
    }

    private async executeCommand(command: Command, output: Subject<any>, args?: any, input?: Observable<any>): Promise<void> {
        try {
            await command.execute(output, args, input);
            if (!output.isStopped) {
                output.complete();
            }
        } catch (e) {
            output.error(e);
        }
    }
}