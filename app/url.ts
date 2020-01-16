/**
 * A part of a URL, that starts after the "host:port" declaration.
 */
export class URL {
    /**
     * Create a new URL from scratch. This means that the created URL will start with '/':
     * @example
     * // returns /api
     * URL.createNew('api');
     * @param value actual value of the URL
     */
    static createNew(value: string): URL {
        return new URL(`/${value}`);
    }

    /**
     * Construct a URL.
     *
     * @param value initial part of the URL
     */
    constructor(public value: string) {
    }

    /**
     * Append specified part to this URL and return a new URL:
     * @example
     * // Existing URL is '/api'. This will return a new URL, which will be '/api/customer'.
     * url.append('customer');
     * @param value URL part to be appended
     */
    append(value: string): URL {
        return new URL(`${this.value}/${value}`);
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return this.value;
    }
}