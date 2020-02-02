import {Mocks} from "./mocks";
import {WebSocketEndpoint} from "../../../../app/common/api/endpoint";
import {AllEvents} from "../../../../app/command-executor/api/web-socket/all-events";
import {capture, instance, verify} from "ts-mockito";
import {expect} from "chai";

describe('AllEvents', function () {
    let mocks: Mocks;
    let endpoint: WebSocketEndpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = new AllEvents(instance(mocks.events));
    });
    it('should notify connection about a new event', async function () {
        // given
        const expectedEvent: any = {};
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const [callback, eventAttributes] = capture(mocks.events.addListener).last();
        callback(expectedEvent);
        // then
        expect(eventAttributes).eql({});
        verify(mocks.connectionMock.send(JSON.stringify(expectedEvent))).once();
    });
    it('should stop listening for events on connection closure', async function () {
        // when
        await endpoint.process(mocks.connection, mocks.req);
        const callback: Function = capture(mocks.connectionMock.on).last()[1];
        callback();
        // then
        verify(mocks.events.removeListener(mocks.listener)).once();
    });
});