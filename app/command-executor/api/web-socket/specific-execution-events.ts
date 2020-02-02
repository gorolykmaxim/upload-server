import {ArgumentsConsumer, WebSocketEndpointWithArguments} from "../../../common/api/endpoint-with-arguments";
import {WebSocketEndpoint} from "../../../common/api/endpoint";
import {Arguments} from "../../../common/arguments";
import {Request} from "express";
import {Events, Listener} from "../../../common/events";
import {Collection} from "../../../common/collection/collection";
import {CommandExecution} from "../../command/command-execution";
import WebSocket = require("ws");
import {StatusChangedEvent} from "../events";

/**
 * Endpoint, that notifies consumers about events, related to the specified execution.
 * Only events of active executions can be listened.
 * When the execution, events of which are being listened, ends - all consumer connections are getting closed
 * automatically.
 */
export class SpecificExecutionEvents implements ArgumentsConsumer, WebSocketEndpoint {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param events events to listen
     * @param activeExecutions collection of executions, that are currently active and can be listened to
     * @param completeExecutions collection of executions, that are complete and can't be listened to
     * @param eventType specific type of event to listen to. If omitted - all kinds of events will be propagated to
     * consumers
     */
    static create(events: Events, activeExecutions: Collection<CommandExecution>, completeExecutions: Collection<CommandExecution>, eventType?: string): WebSocketEndpoint {
        const endpoint: SpecificExecutionEvents = new SpecificExecutionEvents(events, activeExecutions, completeExecutions, eventType);
        return new WebSocketEndpointWithArguments(endpoint, 'params', ['commandId', 'startTime']);
    }

    private constructor(private events: Events, private activeExecutions: Collection<CommandExecution>,
                          private completeExecutions: Collection<CommandExecution>, private eventType?: string) {
    }

    /**
     * {@inheritDoc}
     */
    async process(connection: WebSocket, request: Request): Promise<void> {
        const commandId: string = this.args.get('commandId');
        const startTime: number = parseInt(this.args.get('startTime'));
        const id: any = {commandId: commandId, startTime: startTime};
        if (await this.activeExecutions.contains(id)) {
            const matcher: any = this.eventType ? Object.assign({type: this.eventType}, id) : id;
            const listener: Listener = this.events.addListener(e => connection.send(JSON.stringify(e)), matcher);
            const statusEventsMatcher: any = Object.assign({type: StatusChangedEvent.TYPE}, id);
            const statusListener: Listener = this.events.addListener(e => connection.close(1000, 'The execution is complete'), statusEventsMatcher);
            connection.on('close', () => {
                this.events.removeListener(listener);
                this.events.removeListener(statusListener);
            });
        } else if (await this.completeExecutions.contains(id)) {
            connection.close(1008, 'The execution is complete and cant be watched');
        } else {
            connection.close(1008, 'The execution does not exist');
        }
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}