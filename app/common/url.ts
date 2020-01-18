/**
 * A part of a URL, that starts after the "host:port" declaration.
 */
export class URL {
    private query: URLSearchParams = new URLSearchParams();
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
        const indexOfQuestionSign = value.indexOf('?');
        if (indexOfQuestionSign >= 0) {
            const query: string = value.substring(indexOfQuestionSign + 1, value.length);
            this.query = new URLSearchParams(query);
        }
    }

    /**
     * Append specified part to this URL and return a new URL:
     * @example
     * // Existing URL is '/api'. This will return a new URL, which will be '/api/customer'.
     * url.append('customer');
     * If the URL already contains a query part (e.g. has a '?' in it) - the method will throw an error.
     *
     * @param value URL part to be appended
     */
    append(value: string): URL {
        if (this.value.indexOf('?') >= 0) {
            throw new URLIsAlreadyFinishedError(this.value, value);
        }
        return new URL(`${this.value}/${value}`);
    }

    /**
     * Get value of a query parameter (e.g. a parameter, that is located after a '?' in the URL) with the specified
     * name. If there is no such parameter in the URL - return null.
     *
     * @param name name of the query parameter
     */
    getQueryValueOf(name: string): string {
        return this.query.get(name);
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return this.value;
    }
}

/**
 * Failed to append a part to a URL, construction of which is already finished (contains '?').
 */
export class URLIsAlreadyFinishedError extends Error {
    /**
     * Construct an error.
     *
     * @param url existing URL
     * @param newPart a part that was attempted to be added
     */
    constructor(url: string, newPart: string) {
        super(`URL '${url}' already contains a '?' sign - another part '${newPart}' can't be append to such URL`);
        Object.setPrototypeOf(this, URLIsAlreadyFinishedError.prototype);
    }
}