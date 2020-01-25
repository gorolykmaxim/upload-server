import {Events, Listener, ListenerNotFoundError} from "../../app/common/events";
import { expect } from "chai";

class CallListener {
    private event: any = null;
    private notificationsCount: number = 0;

    notify(event: any): void {
        if (++this.notificationsCount > 1) {
            throw Error('listener called more times than expected');
        }
        this.event = event;
    }

    get isNotified(): boolean {
        return this.event !== null;
    }
}

describe('Events', function () {
    const event: any = {
        'type': 'change',
        'name': 'Tom',
        'age': 24
    };
    let events: Events;
    let listeners: Array<CallListener>;
    beforeEach(function () {
        events = new Events();
        listeners = [new CallListener(), new CallListener()];
    });
    it('should notify first listener only', function () {
       // given
        events.addListener(listeners[0].notify.bind(listeners[0]), {'type': 'change'});
        events.addListener(listeners[1].notify.bind(listeners[1]), {'type': 'output'});
        // when
        events.dispatch(event);
        // then
        expect(listeners[0].isNotified).true;
        expect(listeners[1].isNotified).false;
    });
    it('should notify both listeners', function () {
        // given
        for (let listener of listeners) {
            events.addListener(listener.notify.bind(listener), {'type': 'change'});
        }
        // when
        events.dispatch(event);
        // then
        for (let listener of listeners) {
            expect(listener.isNotified).true;
        }
    });
    it('should notify first listener only since the second one has been removed', function () {
        // given
        let eventListener: Listener;
        for (let listener of listeners) {
            eventListener = events.addListener(listener.notify.bind(listener), {'type': 'change'});
        }
        events.removeListener(eventListener);
        // when
        events.dispatch(event);
        // then
        expect(listeners[0].isNotified).true;
        expect(listeners[1].isNotified).false;
    });
    it('should fail to remove listener that is not registered', function () {
        // given
        const listener: Listener = events.addListener(listeners[0].notify.bind(listeners[0]), {});
        events.removeListener(listener);
        // then
        expect(() => events.removeListener(listener)).to.throw(ListenerNotFoundError);
    });
});