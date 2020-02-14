import {HttpCommand} from "./base";
import {Observable, Subscriber} from "rxjs";
import {HttpEndpoint} from "./http-endpoint";

/**
 * Request registration of {@link HttpEndpoint}s, passed to this command via it's input.
 */
export const REQUEST_HTTP_ENDPOINT_REGISTRATION: string = 'request HTTP endpoint registration';

export class RequestHttpEndpointRegistration extends HttpCommand {
    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        input.subscribe((endpoint: HttpEndpoint) => {this.httpEndpoints.add(endpoint)});
        output.complete();
    }
}
