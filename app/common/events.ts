/**
 * Callback, that will be called when an event with the specified parameters occurs.
 */
export type OnEvent = (event: any) => void;

/**
 * An array of events, that can be listened to.
 */
export class Events {
    private listeners: Array<Listener> = [];

    /**
     * Notify all listeners about a new event, that has just happened.
     *
     * @param event event to notify listeners about
     */
    dispatch(event: any): void {
        this.listeners.forEach(l => l.notifyIfMatches(event));
    }

    /**
     * Create a new listener, that will be called when an event, that has all the specified attributes with the
     * specified values, occurs.
     *
     * @param callback callback to call when such event happens
     * @param eventAttributes attributes and their values the occurring event should have to trigger this listener
     */
    addListener(callback: OnEvent, eventAttributes: any): Listener {
        const listener = new Listener(callback, eventAttributes);
        this.listeners.push(listener);
        return listener;
    }

    /**
     * Un-subscribe the specified listener, so that it won't get notified about new events. If there is not such
     * listener - an error will be thrown.
     *
     * @param listener listener to un-subscribe
     */
    removeListener(listener: Listener): void {
        const indexOfListener: number = this.listeners.indexOf(listener);
        if (indexOfListener < 0) {
            throw new ListenerNotFoundError(listener);
        }
        if (indexOfListener >= 0) {
            this.listeners.splice(indexOfListener, 1);
        }
    }
}

/**
 * An attempt was made to remove a listener that does not exist.
 */
export class ListenerNotFoundError extends Error {
    /**
     * Construct an error.
     *
     * @param listener listener that has not been found
     */
    constructor(listener: Listener) {
        super(`${listener} not found`);
        Object.setPrototypeOf(this, ListenerNotFoundError.prototype);
    }
}

/**
 * Listener, that listens to events that occur.
 */
export class Listener {
    /**
     * Construct a listener.
     *
     * @param callback callback to call when an event matching specified attributes occur
     * @param eventAttributes attributes that should be matched by the event to trigger this listener
     */
    constructor(private callback: OnEvent, private eventAttributes: any) {
    }

    /**
     * Notify this listener about the specified event, this listener is interested in it. If not - this call will
     * be ignored.
     *
     * @param event event to notify the listener about
     */
    notifyIfMatches(event: any): void {
        let shouldNotify: boolean = true;
        for (let parameter in this.eventAttributes) {
            if (this.eventAttributes.hasOwnProperty(parameter) && event[parameter] !== this.eventAttributes[parameter]) {
                shouldNotify = false;
            }
        }
        if (shouldNotify) {
            this.callback(event);
        }
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return `Listener{callback=${this.callback}, eventParameters=${JSON.stringify(this.eventAttributes)}}`;
    }
}