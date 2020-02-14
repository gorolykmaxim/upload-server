import {Endpoint} from "../endpoint";

/**
 * An HTTP endpoint, that triggers specified command's execution.
 */
export class HttpEndpoint extends Endpoint {
    /**
     * Type of content, accepted by this endpoint.
     */
    contentType: string;

    /**
     * Construct an endpoint.
     *
     * @param method HTTP method
     * @param url URL of the endpoint
     * @param commandName name of the command to execute
     */
    constructor(readonly method: string, url: string, commandName: string) {
        super(url, commandName);
    }
}
