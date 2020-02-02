import {WebSocketEndpoint} from "../../../common/api/endpoint";
import WebSocket = require("ws");
import {Request} from "express";
import {Events, Listener} from "../../../common/events";

/**
 * Endpoint that notifies consumers about all command-related events happening.
 */
export class AllEvents implements WebSocketEndpoint {
    /**
     * Construct an endpoint.
     *
     * @param events events to listen
     */
    constructor(private events: Events) {
    }

    /**
     * {@inheritDoc}
     */
    async process(connection: WebSocket, request: Request): Promise<void> {
        const listener: Listener = this.events.addListener(e => connection.send(JSON.stringify(e)), {});
        connection.on('close', () => this.events.removeListener(listener));
    }
}