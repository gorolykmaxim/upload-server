import {Observable, Subscriber} from "rxjs";
import {publish, refCount} from "rxjs/operators";
import {CommandExecutor} from "./command-executor";

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
     * Schedule execution of the command with the specified name. The target command will get executed eventually and
     * only after it's output gets a subscriber (the command will not get executed until then).
     * Use this method when you are either interested in the output of the executed command or want to know when
     * the execution finishes.
     * You HAVE to subscribe to command's output in order for the command to get executed.
     *
     * @param commandName name of the command to execute
     * @param args named arguments to be passed to the specified command
     * @param input observable of data, that can be piped to the target command. If the target command supports it - it
     * can listen to the input and react to it.
     */
    schedule(commandName: string, args?: any, input?: Observable<any>): Observable<any> {
        return this.executor.execute(commandName, args, input).pipe(publish(), refCount());
    }

    /**
     * Schedule execution of the command with the specified name. The target command will get executed eventually.
     * Use this method when you are not interested in the result of the executed command.
     *
     * @param commandName name of the command to execute
     * @param args named arguments to be passed to the specified command
     * @param input observable of data, that can be piped to the target command. If the target command supports it - it
     * can listen to the input and react to it.
     */
    scheduleAndForget(commandName: string, args?: any, input?: Observable<any>): void {
        this.schedule(commandName, args, input).subscribe();
    }

    /**
     * Execute this command. Never call this method directly. Execute a command either using the schedule() or directly
     * calling the command executor's executeCommand().
     *
     * @param output subscriber, to which the output of this command should be published. Closing it manually is not
     * mandatory, though when the execution finishes - the output gets automatically closed, so the execution should
     * not finish until there is nothing else to push to the output.
     * @param args optional named arguments
     * @param input optional observable of data, this command can listen to
     */
    async abstract execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void>;
}
