import {URL} from "../../common/url";

/**
 * URL of a command execution in a command-executor API.
 */
export class CommandExecutionURL extends URL {
    /**
     * Create a URL that points to all executions of the specified command.
     *
     * @param baseURL base URL that points to a specific command
     */
    static allExecutions(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(baseURL.append('execution').value);
    }

    /**
     * Create a template of a URL that points to a specific execution.
     *
     * @param baseURL base URL that points to a specific command
     */
    static singleExecution(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(this.allExecutions(baseURL).append(':startTime').value);
    }

    /**
     * Create a template of a URL, that is used to terminate a specific execution.
     *
     * @param baseURL base URL that points to a specific command
     */
    static terminateExecution(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(this.singleExecution(baseURL).append('terminate').value);
    }

    /**
     * Create a template of a URL, that is used to halt a specific execution.
     *
     * @param baseURL base URL that points to a specific command
     */
    static haltExecution(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(this.singleExecution(baseURL).append('halt').value);
    }

    /**
     * Create a template of a URL, that is used to listen to changes of a status of the specific execution.
     *
     * @param baseURL base URL that points to a specific command
     */
    static executionStatus(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(this.singleExecution(baseURL).append('status').value);
    }

    /**
     * Create a template of a URL, that is used to listen to changes of an output of the specific execution.
     *
     * @param baseURL base URL that points to a specific command
     */
    static executionOutput(baseURL: URL): CommandExecutionURL {
        return new CommandExecutionURL(this.singleExecution(baseURL).append('output').value);
    }

    /**
     * Make this URL point to an execution with the specified start time.
     * Will not be effective for URLs, created with allExecutions() factory-method.
     *
     * @param startTime start time of the execution
     */
    setExecutionStartTime(startTime: number): CommandExecutionURL {
        return new CommandExecutionURL(this.replace(':startTime', startTime.toString()).value);
    }
}