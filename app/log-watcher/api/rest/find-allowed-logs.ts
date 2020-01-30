import {APIRequest} from "../../../common/api/request";
import {Request, Response} from "express";
import {Collection} from "../../../common/collection/collection";
import {FailableRequest} from "../../../common/api/failable-request";
import {WatchableLog} from "./watchable-log";

/**
 * Find all log files, that are allowed to be watched using the API.
 */
export class FindAllowedLogs implements APIRequest {
    /**
     * Create a request.
     *
     * @param allowedLogs collection, that contains absolute paths to log files, that are allowed to be watched
     */
    static create(allowedLogs: Collection<string>): APIRequest {
        return new FailableRequest(new FindAllowedLogs(allowedLogs), 'lookup logs, that are allowed to be watched');
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
}