import {Dictionary, LinkedList} from "typescript-collections";
import {Argument} from "./argument";

/**
 * An instruction to execute a specific command.
 * Arguments, that will be passed to the command, will be taken from the specified sources of the request or message.
 */
export class CommandExecutionInstruction {
    private mandatoryArguments: Dictionary<string, LinkedList<Argument>> = new Dictionary<string, LinkedList<Argument>>();
    private optionalArguments: Dictionary<string, LinkedList<Argument>> = new Dictionary<string, LinkedList<Argument>>();

    /**
     * If set to true, the body of the request, that has triggered this instruction, will
     * be piped as an input to the specified command. Set to false by default.
     */
    pipeInRequestBody: boolean = false;

    /**
     * Dictionary of all static arguments, that will always be passed to the specified command.
     */
    readonly staticArguments: Dictionary<string, any> = new Dictionary<string, any>();

    /**
     * Construct an instruction.
     *
     * @param commandName name of the command to execute
     */
    constructor(readonly commandName: string) {
    }

    /**
     * Get list of all mandatory arguments, that are expected to be located in the specified source.
     *
     * @param source name of the source
     */
    getMandatoryArguments(source: string): LinkedList<Argument> {
        return this.getArguments(source, this.mandatoryArguments);
    }

    /**
     * Get list of all optional arguments, that might be located in the specified source.
     *
     * @param source name of the source
     */
    getOptionalArguments(source: string): LinkedList<Argument> {
        return this.getArguments(source, this.optionalArguments);
    }

    private getArguments(source: string, dictionary: Dictionary<string, LinkedList<Argument>>): LinkedList<Argument> {
        let args: LinkedList<Argument> = dictionary.getValue(source);
        if (!args) {
            args = new LinkedList<Argument>();
            dictionary.setValue(source, args);
        }
        return args;
    }
}
