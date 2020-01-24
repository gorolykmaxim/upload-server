import {URL} from "../../common/url";

/**
 * URL of a command in a command-executor API.
 */
export class CommandURL extends URL {
    /**
     * Create a URL that points to all commands.
     *
     * @param baseURL base URL of the command-executor API
     */
    static allCommands(baseURL: URL): CommandURL {
        return new CommandURL(baseURL.append('command').value);
    }

    /**
     * Create a template of a URL that points to a specific command.
     *
     * @param baseURL base URL of the command-executor API
     */
    static singleCommand(baseURL: URL): CommandURL {
        return new CommandURL(this.allCommands(baseURL).append(':commandId').value);
    }

    /**
     * Make this URL point to a command with the specified ID.
     * Only effective for command URLs, created with a singleCommand() factory method.
     *
     * @param id ID of the command
     */
    setCommandId(id: string): CommandURL {
        return new CommandURL(this.replace(':commandId', id).value);
    }
}