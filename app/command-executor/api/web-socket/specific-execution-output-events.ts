import {ArgumentsConsumer} from "../../../common/api/endpoint-with-arguments";
import {WebSocketEndpoint} from "../../../common/api/endpoint";
import {Arguments} from "../../../common/arguments";
import WebSocket = require("ws");
import {Request} from "express";

export class SpecificExecutionOutputEvents implements ArgumentsConsumer, WebSocketEndpoint {
    private args: Arguments;

    private constructor() {
    }

    async process(connection: WebSocket, request: Request): Promise<void> {
    }

    setArguments(args: Arguments): void {
        this.args = args;
    }
}