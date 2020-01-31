import {Request, Response} from "express";
import WebSocket = require("ws");

/**
 * An HTTP API endpoint, that can process requests, incoming to it.
 */
export interface Endpoint {
    /**
     * Process the incoming request and write a response if necessary.
     *
     * @param req actual request to process
     * @param res response to write data to
     */
    process(req: Request, res: Response): Promise<void>;
}

/**
 * A web-socket endpoint, that can process incoming connections.
 */
export interface WebSocketEndpoint {
    /**
     * Process the incoming connection, initiated by the specified request.
     *
     * @param connection web-socket connection
     * @param request the request, that has initiated the connection
     */
    process(connection: WebSocket, request: Request): Promise<void>;
}