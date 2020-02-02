import {Events, Listener} from "../../../../app/common/events";
import WebSocket = require("ws");
import {Request} from "express";
import {anything, deepEqual, instance, mock, when} from "ts-mockito";
import {Collection} from "../../../../app/common/collection/collection";
import {CommandExecution} from "../../../../app/command-executor/command/command-execution";

export class Mocks {
    readonly commandId: string;
    readonly startTime: number;
    readonly id: any;
    readonly activeExecutions: Collection<CommandExecution>;
    readonly completeExecutions: Collection<CommandExecution>;
    readonly events: Events;
    readonly connectionMock: WebSocket;
    readonly connection: WebSocket;
    readonly reqMock: Request;
    readonly req: Request;
    readonly listenerMock: Listener;
    readonly listener: Listener;

    constructor() {
        this.commandId = '123456';
        this.startTime = 12345;
        this.id = {commandId: this.commandId, startTime: this.startTime};
        this.activeExecutions = mock<Collection<CommandExecution>>();
        this.completeExecutions = mock<Collection<CommandExecution>>();
        this.events = mock(Events);
        this.connectionMock = mock<WebSocket>();
        this.connection = instance(this.connectionMock);
        this.reqMock = mock<Request>();
        this.req = instance(this.reqMock);
        this.listenerMock = mock(Listener);
        this.listener = instance(this.listenerMock);
        when(this.activeExecutions.contains(deepEqual(this.id))).thenResolve(true);
        when(this.reqMock.params).thenReturn({commandId: this.commandId, startTime: this.startTime.toString()});
        when(this.events.addListener(anything(), anything())).thenReturn(this.listener);
    }
}