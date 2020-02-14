import {HttpCommand, HttpEndpoints} from "./base";
import {Observable, Subscriber} from "rxjs";
import {Express} from "express";
import {HttpEndpoint} from "./http-endpoint";
import {PROCESS_HTTP_REQUEST} from "./process-http-request";

/**
 * Register all the endpoints, that were previously requested to be registered by the
 * {@link REQUEST_HTTP_ENDPOINT_REGISTRATION}.
 * For each URL/method/content-type combination there can be only one endpoint. IF there multiple endpoints with
 * different content types, the command will favour the endpoint, that has a specific contentType specified, that
 * matches the one of the request. If during the request processing the command will not find any endpoints with
 * specific contentType, that matches the content type of the request, it will pick the first endpoint with no
 * contentType specified.
 */
export const REGISTER_HTTP_ENDPOINTS: string = 'register http endpoints';

export class RegisterHttpEndpoints extends HttpCommand {
    constructor(httpEndpoints: HttpEndpoints, private express: Express) {
        super(httpEndpoints);
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        for (let url of this.httpEndpoints.getUrls()) {
            this.express.route(url).all((req, res, next) => {
                const endpoints: Array<HttpEndpoint> = this.httpEndpoints.getEndpointsWithUrlAndMethod(url, req.method);
                const endpointsWithSpecificContentType: Array<HttpEndpoint> = endpoints.filter(e => e.contentType);
                for (let endpoint of endpointsWithSpecificContentType) {
                    if (req.header('content-type') === endpoint.contentType) {
                        this.scheduleAndForget(PROCESS_HTTP_REQUEST, {endpoint: endpoint, request: req, response: res});
                        return;
                    }
                }
                const endpointsWithoutContentType: Array<HttpEndpoint> = endpoints.filter(e => !e.contentType);
                if (endpointsWithoutContentType.length > 0) {
                    const endpointWithoutContentType: HttpEndpoint = endpoints.filter(e => !e.contentType)[0];
                    this.scheduleAndForget(PROCESS_HTTP_REQUEST, {endpoint: endpointWithoutContentType, request: req, response: res});
                } else {
                    res.status(501).end();
                }
            });
        }
        output.complete();
    }
}
