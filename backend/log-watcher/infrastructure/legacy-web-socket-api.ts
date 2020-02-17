import {Api} from "../../api";
import {Request} from "express";
import {Subscription} from "rxjs";
import {LogWatcherBoundedContext} from "../domain/log-watcher-bounded-context";
import WebSocket = require("ws");

const Schema = require('validate');

export class LegacyWebSocketApi extends Api {
    constructor(private app: any, private logWatcherBoundedContext: LogWatcherBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        const messageSchema = new Schema({
            type: {
                type: String,
                required: true,
                enum: ['watch', 'unwatch']
            },
            file: {
                type: String,
                required: true
            },
            fromStart: {
                type: Boolean,
                required: false
            }
        });
        this.app.ws('/', (connection: WebSocket, req: Request) => {
            const pathToSubscription: Map<string, Subscription> = new Map<string, Subscription>();
            connection.on('message', rawMessage => {
                try {
                    const message: any = JSON.parse(rawMessage.toString());
                    messageSchema.assert(message);
                    if (message.type === 'watch') {
                        const subscription: Subscription = this.logWatcherBoundedContext.watchLogFileContent(message.file, true, message.fromStart).subscribe(
                            changes => connection.send(JSON.stringify(Object.assign({type: 'change'}, changes))),
                            error => {
                                connection.send(JSON.stringify({type: 'error', message: error.message}));
                                pathToSubscription.delete(message.file);
                            }
                        );
                        pathToSubscription.set(message.file, subscription);
                    } else {
                        const subscription: Subscription = pathToSubscription.get(message.file);
                        if (subscription) {
                            subscription.unsubscribe();
                            pathToSubscription.delete(message.file);
                        }
                    }
                } catch (e) {
                    console.error(e.message, this);
                    connection.send(JSON.stringify({type: 'error', message: e.message}));
                }
            });
            connection.on('close', () => {
                pathToSubscription.forEach(s => s.unsubscribe());
                pathToSubscription.clear();
            });
        });
    }
}
