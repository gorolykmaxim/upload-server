import {CommandExecutionInstruction} from "./command-execution-instructions";
import {Dictionary} from "typescript-collections";
import {Argument} from "./argument";
import {Request} from "express";
import {ArgumentError} from "common-errors";

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
    private commandErrorCodeToResponseCode: Dictionary<number, number> = new Dictionary<number, number>();

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
     * Get name of the command to execute, when a request lands to the endpoint.
     */
    get commandName(): string {
        return this.instruction.commandName;
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
     * If processing of a request, that lands on this endpoint, finishes with an error - send the specified response
     * code.
     *
     * @param commandErrorCode expected command error code
     * @param responseErrorCode corresponding response code
     */
    mapCommandToResponse(commandErrorCode: number, responseErrorCode: number): void {
        this.commandErrorCodeToResponseCode.setValue(commandErrorCode, responseErrorCode);
    }

    /**
     * Return the response code to respond to a request, landing on this endpoint, with if the processing of it
     * finishes with an error with the specified code.
     *
     * @param commandErrorCode error code of a failed command
     */
    getResponseCodeFor(commandErrorCode: number): number {
        return this.commandErrorCodeToResponseCode.getValue(commandErrorCode);
    }

    /**
     * Extract all arguments from the specified request (both optional and mandatory) according to the endpoint's
     * configuration, assign endpoint's static arguments to the result and return it as a simple one-level key-value
     * pair object.
     *
     * @param request request to extract arguments from
     */
    convertRequestToCommandArguments(request: Request): any {
        let commandArguments: any = {};
        for (let source of Object.values(ArgumentsSource)) {
            for (let mandatoryArgument of this.instruction.getArguments(source, true).toArray()) {
                let value: any = request[source][mandatoryArgument.name];
                if (!value) {
                    throw new ArgumentError(`${mandatoryArgument.name} in ${source}`);
                }
                mandatoryArgument.verifyValue(value);
                commandArguments[mandatoryArgument.name] = value;
            }
            for (let optionalArgument of this.instruction.getArguments(source, false).toArray()) {
                let value: any = request[source][optionalArgument.name];
                if (value) {
                    optionalArgument.verifyValue(value);
                    commandArguments[optionalArgument.name] = value;
                }
            }
        }
        for (let staticArgument of this.instruction.staticArguments.keys()) {
            commandArguments[staticArgument] = this.instruction.staticArguments.getValue(staticArgument);
        }
        return commandArguments;
    }
}
