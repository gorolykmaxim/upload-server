import {Mocks} from "./mocks";
import {WebSocketEndpoint} from "../../../../app/common/api/endpoint";
import {SpecificExecutionEvents} from "../../../../app/command-executor/api/web-socket/specific-execution-events";
import {capture, deepEqual, instance, verify, when} from "ts-mockito";
import { expect } from "chai";
import {StatusChangedEvent} from "../../../../app/command-executor/api/events";

describe('SpecificExecutionEvents', function () {
    const expectedEvent: any = {};
    let mocks: Mocks;
    let endpoint: WebSocketEndpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = SpecificExecutionEvents.create(instance(mocks.events), instance(mocks.activeExecutions), instance(mocks.completeExecutions));
    });
    it('should immediately close connection since the specified execution is complete', async function () {
        // given
        when(mocks.activeExecutions.contains(deepEqual(mocks.id))).thenResolve(false);
        when(mocks.completeExecutions.contains(deepEqual(mocks.id))).thenResolve(true);
        // when
        await endpoint.process(mocks.connection, mocks.req);
        // then
        verify(mocks.connectionMock.close(1008, 'The execution is complete and cant be watched')).once();
    });
    it('should immediately close connection since the specified execution does not exist', async function () {
        // given
        when(mocks.activeExecutions.contains(deepEqual(mocks.id))).thenResolve(false);
        when(mocks.completeExecutions.contains(deepEqual(mocks.id))).thenResolve(false);
        // when
        await endpoint.process(mocks.connection, mocks.req);
        // then
        verify(mocks.connectionMock.close(1008, 'The execution does not exist')).once();
    });
    it('should notify connection about all events related to the execution', async function () {
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const [callback, matcher] = capture(mocks.events.addListener).first();
        callback(expectedEvent);
        // then
        expect(matcher).eql(mocks.id);
        verify(mocks.connectionMock.send(JSON.stringify(expectedEvent))).once();
    });
    it('should notify connection about events with the specified type related to the execution', async function () {
        // given
        const eventType = 'output';
        endpoint = SpecificExecutionEvents.create(instance(mocks.events), instance(mocks.activeExecutions), instance(mocks.completeExecutions), eventType);
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const [callback, matcher] = capture(mocks.events.addListener).first();
        callback(expectedEvent);
        // then
        expect(matcher).eql(Object.assign({type: eventType}, mocks.id));
        verify(mocks.connectionMock.send(JSON.stringify(expectedEvent))).once();
    });
    it('should close connection when the execution is complete', async function () {
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const [callback, matcher] = capture(mocks.events.addListener).last();
        callback(expectedEvent);
        // then
        expect(matcher).eql(Object.assign({type: StatusChangedEvent.TYPE}, mocks.id));
        verify(mocks.connectionMock.close(1000, 'The execution is complete')).once();
    });
    it('should remove all created event listeners when the connection closes', async function () {
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const callback: Function = capture(mocks.connectionMock.on).last()[1];
        callback();
        // then
        verify(mocks.events.removeListener(mocks.listener)).twice();
    });
});