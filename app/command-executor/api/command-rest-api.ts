import {URL} from "../../common/url";
import {CommandFactory} from "../command/command-factory";
import {Command} from "../command/command";
import {Collection, EntityNotFoundError} from "../../common/collection/collection";
import {Application, Request, Response} from "express";
import {ArgumentError} from "common-errors";
import {Arguments} from "../../common/arguments";
import {CommandURL} from "./command-url";
import {CommandExecutionURL} from "./command-execution-url";

/**
 * REST API of a command-executor, that allows querying/creating/removing executable commands.
 * Contains following endpoints:
 * - GET /command - get list of commands that can be executed
 * - POST /command - create a new command
 * - DELETE /command/:commandId - remove a command with the specified ID
 */
export class CommandRestAPI {
    /**
     * Construct an API.
     *
     * @param server server to listen to incoming requests on
     * @param baseURL base URL of the API
     * @param factory factory, that will be used to create new commands
     * @param commands collection, that will be used to store commands
     */
    constructor(server: Application, private baseURL: URL, private factory: CommandFactory, private commands: Collection<Command>) {
        server.get(CommandURL.allCommands(baseURL).value, this.findAllCommands.bind(this));
        server.post(CommandURL.allCommands(baseURL).value, this.createCommand.bind(this));
        server.delete(CommandURL.singleCommand(baseURL).value, this.removeCommand.bind(this));
    }

    private async findAllCommands(req: Request, res: Response): Promise<void> {
        try {
            const foundCommands: Array<Command> = await this.commands.findAll();
            const executableCommands: Array<ExecutableCommand> = foundCommands.map(c => new ExecutableCommand(c, this.baseURL));
            res.end(JSON.stringify(executableCommands));
        } catch (e) {
            res.status(500).end(APIError.commandsLookup(e).message);
        }
    }

    private async createCommand(req: Request, res: Response): Promise<void> {
        let name: string;
        let script: string;
        try {
            const args: Arguments = new Arguments(req.body, ['name', 'script']);
            name = args.get('name');
            script = args.get('script');
            const command: Command = this.factory.create(name, script);
            await this.commands.add(command);
            const executableCommand: ExecutableCommand = new ExecutableCommand(command, this.baseURL);
            res.end(JSON.stringify(executableCommand));
        } catch (e) {
            let code;
            if (e instanceof ArgumentError) {
                code = 400;
            } else {
                code = 500;
            }
            res.status(code).end(APIError.commandCreation(name, script, e).message);
        }
    }

    private async removeCommand(req: Request, res: Response): Promise<void> {
        let id: string;
        try {
            const args: Arguments = new Arguments(req.params, ['commandId']);
            id = args.get('commandId');
            const command: Command = await this.commands.findById(id);
            await this.commands.remove(command);
            res.end();
        } catch (e) {
            let code;
            if (e instanceof ArgumentError) {
                code = 400;
            } else if (e instanceof EntityNotFoundError) {
                code = 404;
            } else {
                code = 500;
            }
            res.status(code).end(APIError.commandRemoval(id, e).message);
        }
    }
}

/**
 * An error, that may occur during interaction with command API.
 */
export class APIError extends Error {
    /**
     * Failed to find all commands, that can be executed.
     *
     * @param cause root cause
     */
    static commandsLookup(cause: Error): APIError {
        return new APIError('Failed to find commands, that can be executed', cause);
    }

    /**
     * Failed to create a new command.
     *
     * @param name name of the command
     * @param script actual body of the command
     * @param cause root cause
     */
    static commandCreation(name: string, script: string, cause: Error): APIError {
        return new APIError(`Failed to create a command with name '${name}' and script '${script}'`, cause);
    }

    /**
     * Failed to remove a command.
     *
     * @param id ID of the command
     * @param cause root cause
     */
    static commandRemoval(id: string, cause: Error): APIError {
        return new APIError(`Failed to remove a command with ID '${id}'`, cause);
    }

    /**
     * Construct an error.
     *
     * @param message message of the error
     * @param cause root cause of the error
     */
    constructor(message: string, cause: Error) {
        super(`${message}. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

/**
 * A command, that can be executed by the clients of the Command Executor API.
 */
export class ExecutableCommand {
    public readonly id: string;
    public readonly name: string;
    public readonly script: string;
    public readonly httpLinks: HTTPLinks;

    /**
     * Construct a command.
     *
     * @param command an actual command, to construct from
     * @param baseURL base URL of the command executor API
     */
    constructor(command: Command, baseURL: URL) {
        this.id = command.id;
        this.name = command.name;
        this.script = command.script;
        const commandURL: CommandURL = CommandURL.singleCommand(baseURL).setCommandId(this.id);
        const commandExecutionURL: CommandExecutionURL = CommandExecutionURL.allExecutions(commandURL);
        this.httpLinks = {
            remove: commandURL.value,
            getExecutionHistory: commandExecutionURL.value,
            execute: commandExecutionURL.value
        };
    }
}

/**
 * HTTP links to a command and resources, related to it.
 */
export interface HTTPLinks {
    /**
     * Link to remove a specific command.
     */
    remove?: string;
    /**
     * Link to get a history of executions of this specific command.
     */
    getExecutionHistory?: string
    /**
     * Link to execute the command.
     */
    execute?: string;
}