import {Api} from "../../api";
import {LogWatcherBoundedContext} from "../domain/log-watcher-bounded-context";
import {Request} from "express";
import {Subscription} from "rxjs";
import WebSocket = require("ws");
const Schema = require('validate');

export class WebSocketApi extends Api {
    constructor(private app: any, private logWatcherBoundedContext: LogWatcherBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        const requestQuerySchema = new Schema({
            absolutePath: {
                type: String,
                required: true
            },
            fromStart: {
                type: String,
                required: false
            }
        });
        this.app.ws(`${baseUrl}/log`, (connection: WebSocket, req: Request) => {
            try {
                requestQuerySchema.assert(req.query);
                const subscription: Subscription = this.logWatcherBoundedContext.watchLogFileContent(req.query.absolutePath, false, req.query.fromStart == 'true').subscribe(
                    change => connection.send(JSON.stringify(change)),
                    error => connection.close(1008, error.message)
                );
                connection.on('close', () => subscription.unsubscribe());
            } catch (e) {
                connection.close(1008, e.message);
            }
        });
    }
}
