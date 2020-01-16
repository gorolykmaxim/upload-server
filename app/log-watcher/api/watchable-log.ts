import {URL} from "../../url";

/**
 * A log file, that can be watched by users of the "log-watcher" API.
 */
export class WatchableLog {
    public webSocketlinks: WebSocketLinks;
    public httpLinks: HTTPLinks;

    /**
     * Construct a watchable log.
     *
     * @param absolutePath absolute path to the log file
     * @param logURL base URL of a watchable log entity
     * @param logSizeURL URL to obtain a size of a watchable log entity
     * @param logContentURL URL to obtain a content of a watchable log entity
     */
    constructor(public absolutePath: string, logURL: URL, logSizeURL: URL, logContentURL: URL) {
        const thisLogURL = `${logURL.value}?absolutePath=${absolutePath}`;
        this.webSocketlinks = {
            watch: thisLogURL,
            watchFromBeginning: `${thisLogURL}&fromStart=true`
        };
        this.httpLinks = {
            remove: thisLogURL,
            getSize: `${logSizeURL.value}?absolutePath=${absolutePath}`,
            getContent: `${logContentURL.value}?absolutePath=${absolutePath}`
        };
    }
}

/**
 * Set of websocket links, that can be used to access a watchable log.
 */
export interface WebSocketLinks {
    /**
     * Link to start watching new changes in the watchable log.
     */
    watch?: string,
    /**
     * Link to read existing content of a watchable log and start listening to new changes in it.
     */
    watchFromBeginning?: string,
}

export interface HTTPLinks {
    /**
     * Link to delete the watchable log.
     */
    remove?: string,
    /**
     * Link to get size of the watchable log in bytes.
     */
    getSize?: string,
    /**
     * Link to get content of the watchable log.
     */
    getContent?: string
}