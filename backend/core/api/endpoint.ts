import {CommandExecutionInstruction} from "./command-execution-instructions";
import {Dictionary, LinkedList} from "typescript-collections";
import {Argument} from "./argument";

/**
 * An abstract API endpoint, that triggers specified command's execution.
 */
export class Endpoint {
    private static readonly QUERY_SOURCE: string = 'query';
    private static readonly BODY_SOURCE: string = 'body';
    private static readonly PARAMS_SOURCE: string = 'params';

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
     * Get list of mandatory arguments, that are expected to be present in the 'query' of the request.
     */
    get mandatoryQueryArguments(): LinkedList<Argument> {
        return this.instruction.getMandatoryArguments(Endpoint.QUERY_SOURCE);
    }

    /**
     * Get list of mandatory arguments, that are expected to be present in the 'body' of the request.
     */
    get mandatoryBodyArguments(): LinkedList<Argument> {
        return this.instruction.getMandatoryArguments(Endpoint.BODY_SOURCE);
    }

    /**
     * Get list of mandatory arguments, that are expected to be present in the 'params' of the request.
     */
    get mandatoryParamsArguments(): LinkedList<Argument> {
        return this.instruction.getMandatoryArguments(Endpoint.PARAMS_SOURCE);
    }

    /**
     * Get list of optional arguments, that might be present in the 'query' of the request.
     */
    get optionalQueryArguments(): LinkedList<Argument> {
        return this.instruction.getOptionalArguments(Endpoint.QUERY_SOURCE);
    }

    /**
     * Get list of optional arguments, that might be present in the 'body' of the request.
     */
    get optionalBodyArguments(): LinkedList<Argument> {
        return this.instruction.getOptionalArguments(Endpoint.BODY_SOURCE);
    }

    /**
     * Get list of optional arguments, that might be present in the 'params' of the request.
     */
    get optionalParamsArguments(): LinkedList<Argument> {
        return this.instruction.getOptionalArguments(Endpoint.PARAMS_SOURCE);
    }

    /**
     * Dictionary of all static arguments, that will always be passed to the specified command.
     */
    get staticArguments(): Dictionary<string, any> {
        return this.instruction.staticArguments;
    }
}
