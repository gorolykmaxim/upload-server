import {CommandExecution} from "../../../../command/command-execution";

/**
 * Execution of a command.
 */
export class CommandExecutionModel {
    public readonly commandId: string;
    public readonly startTime: number;
    public readonly eol: string;
    public readonly status: string;
    public readonly output: string | Array<string> = [];

    /**
     * Construct an execution.
     *
     * @param execution an actual execution to construct from
     * @param noSplit if set to true - the output of this execution (STDOUT and STDERR) will be present as an
     * array of output lines. If set to false - the output will be present as a single string. If the parameter
     * is not set at all - the output will be an empty array.
     */
    constructor(execution: CommandExecution, noSplit?: boolean) {
        this.commandId = execution.commandId;
        this.startTime = execution.startTime;
        this.eol = execution.eol;
        this.status = execution.getStatus().toString();
        if (noSplit === true) {
            this.output = execution.getOutputAsString();
        } else if (noSplit === false) {
            this.output = execution.getOutputLines();
        }
    }
}