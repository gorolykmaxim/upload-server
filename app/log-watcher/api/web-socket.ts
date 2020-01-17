import WebSocket = require("ws");

/**
 * Create string representation of the specified web-socket for logging purposes.
 *
 * @param socket socket to stringify
 */
export function webSocketToString(socket: WebSocket): string {
    return `WebSocket{binaryType=${socket.binaryType}, bufferedAmount=${socket.bufferedAmount}, extensions=${socket.extensions}, protocol=${socket.protocol}, readyState=${socket.readyState}, url=${socket.url}}`;
}