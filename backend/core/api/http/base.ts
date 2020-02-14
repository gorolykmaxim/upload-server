import {Command} from "../../command/command";
import {Dictionary, LinkedList} from "typescript-collections";
import {HttpEndpoint} from "./http-endpoint";

/**
 * Base class for all HTTP-related commands.
 */
export abstract class HttpCommand extends Command {
    /**
     * Construct a command.
     *
     * @param httpEndpoints all HTTP endpoints, that should be processed by this application.
     */
    constructor(protected httpEndpoints: HttpEndpoints) {
        super();
    }
}

/**
 * Collection of {@link HttpEndpoint}.
 */
export class HttpEndpoints {
    private urlToMethodsToEndpoints: Dictionary<string, Dictionary<string, LinkedList<HttpEndpoint>>> = new Dictionary<string, Dictionary<string, LinkedList<HttpEndpoint>>>();

    /**
     * Add the specified endpoint to the collection.
     *
     * @param endpoint endpoint to add
     */
    add(endpoint: HttpEndpoint): void {
        let methodsToEndpoints: Dictionary<string, LinkedList<HttpEndpoint>> = this.urlToMethodsToEndpoints.getValue(endpoint.url);
        if (!methodsToEndpoints) {
            methodsToEndpoints = new Dictionary<string, LinkedList<HttpEndpoint>>();
            this.urlToMethodsToEndpoints.setValue(endpoint.url, methodsToEndpoints);
        }
        let endpoints: LinkedList<HttpEndpoint> = methodsToEndpoints.getValue(endpoint.method);
        if (!endpoints) {
            endpoints = new LinkedList<HttpEndpoint>();
            methodsToEndpoints.setValue(endpoint.method.toUpperCase(), endpoints);
        }
        endpoints.add(endpoint);
    }

    /**
     * Get all URLs, of endpoints in this collection. This will not return duplicated URLs.
     */
    getUrls(): Array<string> {
       return this.urlToMethodsToEndpoints.keys();
    }

    /**
     * Get methods, of endpoints with the specified url, that are stored in the collection. This will not return
     * duplicate methods.
     *
     * @param url url, supported methods of which should be found
     */
    getMethodsOfUrl(url: string): Array<string> {
        const methodsToEndpoints: Dictionary<string, LinkedList<HttpEndpoint>> = this.urlToMethodsToEndpoints.getValue(url);
        return methodsToEndpoints ? methodsToEndpoints.keys() : [];
    }

    /**
     * Get all the endpoints in the collection with the specified method and URL.
     *
     * @param url endpoint URL
     * @param method endpoint method
     */
    getEndpointsWithUrlAndMethod(url: string, method: string): Array<HttpEndpoint> {
        const methodsToEndpoints: Dictionary<string, LinkedList<HttpEndpoint>> = this.urlToMethodsToEndpoints.getValue(url);
        if (!methodsToEndpoints) {
            return [];
        }
        const endpoints: LinkedList<HttpEndpoint> = methodsToEndpoints.getValue(method.toUpperCase());
        return endpoints ? endpoints.toArray() : [];
    }
}
