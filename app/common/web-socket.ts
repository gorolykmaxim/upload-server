import WebSocket = require("ws");
import {Request} from "express";

/**
 * Create string representation of the specified web-socket for logging purposes.
 *
 * @param socket socket to stringify
 */
export function webSocketToString(socket: WebSocket): string {
    return `WebSocket{binaryType=${socket.binaryType}, bufferedAmount=${socket.bufferedAmount}, extensions=${socket.extensions}, protocol=${socket.protocol}, readyState=${socket.readyState}, url=${socket.url}}`;
}

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