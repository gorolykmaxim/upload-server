import {Endpoint} from "../../../common/api/endpoint";
import {Request, Response} from "express";
import {Collection} from "../../../common/collection/collection";
import {FailableEndpoint} from "../../../common/api/failable-endpoint";
import {WatchableLog} from "./watchable-log";

/**
 * Find all log files, that are allowed to be watched using the API.
 */
export class FindAllowedLogs implements Endpoint {
    /**
     * Create an endpoint.
     *
     * @param allowedLogs collection, that contains absolute paths to log files, that are allowed to be watched
     */
    static create(allowedLogs: Collection<string>): Endpoint {
        return new FailableEndpoint(new FindAllowedLogs(allowedLogs), 'lookup logs, that are allowed to be watched');
    }

    private constructor(private allowedLogs: Collection<string>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        console.info("%s receives a request to find all logs, that are allowed to be watched", this);
        const allowedLogs: Array<string> = await this.allowedLogs.findAll();
        const watchableLogs: Array<WatchableLog> = allowedLogs.map(al => new WatchableLog(al));
        res.end(JSON.stringify(watchableLogs));
    }

    /**
     * {@inheritDoc}
     */
    toString() {
        return 'FindAllowedLogs{}';
    }
}