import {CommandExecutionInstruction} from "./command-execution-instructions";
import {Dictionary, LinkedList} from "typescript-collections";
import {Argument} from "./argument";

/**
 * Possible sources of arguments in scope of an endpoint.
 */
export enum ArgumentsSource {
    QUERY = 'query',
    BODY = 'body',
    PARAMS = 'params'
}

/**
 * An abstract API endpoint, that triggers specified command's execution.
 */
export class Endpoint {
    private instruction: CommandExecutionInstruction;

    /**
     * Construct an endpoint.
     *
     * @param url URL of the endpoint
     * @param commandName name of the command to execute
     */
    constructor(readonly url: string, commandName: string) {
        this.instruction = new CommandExecutionInstruction(commandName);
    }

    set pipeInRequestBody(value: boolean) {
        this.instruction.pipeInRequestBody = value;
    }

    /**
     * If set to true, the body of the request, that has triggered this instruction, will
     * be piped as an input to the specified command. Set to false by default.
     */
    get pipeInRequestBody(): boolean {
        return this.instruction.pipeInRequestBody;
    }

    /**
     * Get list of all arguments, that are expected to be located in the specified source.
     *
     * @param source name of the source
     * @param mandatory if set to true - only mandatory arguments will be returned. If set to false - only optional
     * arguments will be returned
     */
    getArguments(source: ArgumentsSource, mandatory: boolean): LinkedList<Argument> {
        return this.instruction.getArguments(source, mandatory);
    }

    /**
     * Add argument, that is expected to be located in the specified source.
     *
     * @param source name of the source
     * @param mandatory specifies if the argument is expected to be always present or not
     * @param argument argument to add
     */
    addArgument(source: ArgumentsSource, mandatory: boolean, argument: Argument): void {
        this.instruction.addArgument(source, mandatory, argument);
    }

    /**
     * Dictionary of all static arguments, that will always be passed to the specified command.
     */
    get staticArguments(): Dictionary<string, any> {
        return this.instruction.staticArguments;
    }
}
