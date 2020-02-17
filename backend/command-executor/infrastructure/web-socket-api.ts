import {Api} from "../../api";
import {CommandExecutorBoundedContext, NoActiveExecutionFound} from "../domain/command-executor-bounded-context";
import {Request} from "express";
import {Observable, Subscription} from "rxjs";
import WebSocket = require("ws");

export class WebSocketApi extends Api {
    constructor(private app: any, private commandExecutorBoundedContext: CommandExecutorBoundedContext) {
        super();
    }

    initialize(baseUrl: string): void {
        this.app.ws(`${baseUrl}/event`, async (connection: WebSocket, req: Request) => {
            const subscription: Subscription = (await this.commandExecutorBoundedContext.watchAllEvents())
                .subscribe(e => connection.send(JSON.stringify(e)));
            connection.on('close', () => subscription.unsubscribe());
        });
        this.app.ws(`${baseUrl}/command/:commandId/execution/:startTime`, (connection: WebSocket, req: Request) => {
            this.handleConnection(this.commandExecutorBoundedContext.watchAllEvents(req.params.commandId, parseInt(req.params.startTime)), connection);
        });
        this.app.ws(`${baseUrl}/command/:commandId/execution/:startTime/status`, (connection: WebSocket, req: Request) => {
            this.handleConnection(this.commandExecutorBoundedContext.watchStatusOfExecution(req.params.commandId, parseInt(req.params.startTime)), connection);
        });
        this.app.ws(`${baseUrl}/command/:commandId/execution/:startTime/output`, (connection: WebSocket, req: Request) => {
            this.handleConnection(this.commandExecutorBoundedContext.watchOutputOfExecution(req.params.commandId, parseInt(req.params.startTime), req.query.fromStart == 'true'), connection);
        });
    }

    private async handleConnection(events: Promise<Observable<any>>, connection: WebSocket): Promise<void> {
        try {
            const subscription: Subscription = (await events)
                .subscribe(e => connection.send(JSON.stringify(e, (k, v) => v instanceof Error ? v.message : v)))
                .add(() => connection.close(1000, 'The execution is complete'));
            connection.on('close', () => subscription.unsubscribe());
        } catch (e) {
            console.error(e.message, this);
            if (e instanceof NoActiveExecutionFound) {
                connection.close(1008, 'Only executions, that are currently running, can be listened to');
            } else {
                connection.close(1008, e.message);
            }
        }
    }
}
