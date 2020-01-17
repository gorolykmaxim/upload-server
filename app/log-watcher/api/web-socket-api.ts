import WebSocket = require("ws");
import {Request} from "express";

/**
 * An API, that handles web-socket connections and requests.
 */
export interface WebSocketAPI {
    /**
     * Process a new opened web-socket connection.
     *
     * @param connection new web-socket connection
     * @param request HTTP request, that has originated the connection
     */
    onConnectionOpen(connection: WebSocket, request: Request): Promise<void>;
}