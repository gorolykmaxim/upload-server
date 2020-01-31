import {Arguments} from "../arguments";
import {Request, Response} from "express";
import {Endpoint, WebSocketEndpoint} from "./endpoint";
import WebSocket = require("ws");

/**
 * An endpoint, that requires mandatory arguments in order to process a request.
 */
export interface ArgumentsConsumer {
    /**
     * Set arguments, the endpoint will use during the processing.
     *
     * @param args request arguments
     */
    setArguments(args: Arguments): void;
}

/**
 * An endpoint that checks if all mandatory arguments where send by a client.
 */
export class EndpointWithArguments implements Endpoint {
    /**
     * Construct an endpoint.
     *
     * @param actualEndpoint actual endpoint, processing of which requires arguments
     * @param argumentsSourceName name of a request part, that contains the arguments: either a "query", "body" or "params"
     * @param expectedArguments list of arguments names, which are mandatory
     */
    constructor(private actualEndpoint: Endpoint & ArgumentsConsumer, private argumentsSourceName: string,
                private expectedArguments: Array<string>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const argumentsSource: any = req;
        const args: Arguments = new Arguments(argumentsSource[this.argumentsSourceName], this.expectedArguments);
        this.actualEndpoint.setArguments(args);
        await this.actualEndpoint.process(req, res);
    }
}


/**
 * An endpoint that checks if all mandatory arguments where send by a client.
 */
export class WebSocketEndpointWithArguments implements WebSocketEndpoint {
    /**
     * Construct an endpoint.
     *
     * @param actualEndpoint actual endpoint, processing of which requires arguments
     * @param argumentsSourceName name of a request part, that contains the arguments: either a "query", "body" or "params"
     * @param expectedArguments list of arguments names, which are mandatory
     */
    constructor(private actualEndpoint: WebSocketEndpoint & ArgumentsConsumer, private argumentsSourceName: string,
                private expectedArguments: Array<string>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(connection: WebSocket, request: Request): Promise<void> {
        const argumentsSource: any = request;
        const args: Arguments = new Arguments(argumentsSource[this.argumentsSourceName], this.expectedArguments);
        this.actualEndpoint.setArguments(args);
        await this.actualEndpoint.process(connection, request);
    }
}