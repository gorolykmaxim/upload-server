import * as express from "express";
import {Observable, ReplaySubject, Subject} from "rxjs";
import {EventEmitter} from "events";
import {take} from "rxjs/operators";

type OnConnection = (connection: any, req: any) => void | Promise<void>;

export class DummyWebSocket {
    closeCode: number;
    closeMessage: string;
    private messageSubject: Subject<any> = new ReplaySubject<any>();
    private closeSubject: Subject<void> = new ReplaySubject<void>();
    private emitter: EventEmitter = new EventEmitter();

    receive(data: any): void {
        this.emitter.emit('message', JSON.stringify(data));
    }

    close(code: number, message: string): void {
        this.closeCode = code;
        this.closeMessage = message;
        this.closeSubject.next();
        this.emitter.emit('close');
    }

    on(event: string, callback: (...args: any[]) => void): void {
        this.emitter.on(event, callback);
    }

    send(data: any): void {
        this.messageSubject.next(JSON.parse(data));
    }

    get closeEvent(): Observable<void> {
        return this.closeSubject.pipe(take(1));
    }

    get messages(): Observable<any> {
        return this.messageSubject;
    }

    get oneMessage(): Promise<any> {
        return this.messages.pipe(take(1)).toPromise();
    }
}

export class DummyWebSocketServer {
    private urlToCallback: any = {};

    async connect(url: string, query?: any, params?: any): Promise<DummyWebSocket> {
        const socket: DummyWebSocket = new DummyWebSocket();
        const callback: OnConnection = this.urlToCallback[url];
        const result: any = callback(socket, {query: query, params: params});
        if (result instanceof Promise) {
            await result;
        }
        return socket;
    }

    ws(url: string, callback: OnConnection): void {
        this.urlToCallback[url] = callback;
    }
}

export function mockWebSocketExpress(): any {
    const application: any = express();
    const dummyWebSocketServer: DummyWebSocketServer = new DummyWebSocketServer();
    application.dummyWebSocketServer = dummyWebSocketServer;
    application.ws = dummyWebSocketServer.ws.bind(dummyWebSocketServer);
    return application;
}
