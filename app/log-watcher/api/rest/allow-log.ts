import {APIRequest} from "../../../common/api/request";
import {Request, Response} from "express";
import {Collection} from "../../../common/collection/collection";
import {ArgumentsConsumer, RequestWithArguments} from "../../../common/api/request-with-arguments";
import {Arguments} from "../../../common/arguments";
import {FileSystem} from "../../log/file-system";
import {FailableRequest} from "../../../common/api/failable-request";
import {ArgumentError} from "common-errors";
import {WatchableLog} from "./watchable-log";

/**
 * Allow specified log file to be watched using the API.
 */
export class AllowLog implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create a request.
     *
     * @param allowedLogs collection, that contains absolute paths to log files, that are allowed to be watched
     * @param fileSystem file system, on which the log file is supposed to exist
     */
    static create(allowedLogs: Collection<string>, fileSystem: FileSystem): APIRequest {
        const request: ArgumentsConsumer = new AllowLog(allowedLogs, fileSystem);
        const requestWithArguments: RequestWithArguments = new RequestWithArguments(request, 'body', ['absolutePath']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'allow a log file to be watched');
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        return failableRequest;
    }

    private constructor(private allowedLogs: Collection<string>, private fileSystem: FileSystem) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const absoluteLogFilePath: string = this.args.get('absolutePath');
        console.info("%s receives a request to allow a log '%s' to be watched", this, absoluteLogFilePath);
        let responseBody = new WatchableLog(absoluteLogFilePath);
        if (!await this.allowedLogs.contains(absoluteLogFilePath)) {
            await this.allowedLogs.add(absoluteLogFilePath);
        }
        try {
            await this.fileSystem.accessAsync(absoluteLogFilePath);
        } catch (e) {
            responseBody = Object.assign({notice: 'At this moment the log either does not exist or is inaccessible.'}, responseBody);
        }
        res.end(JSON.stringify(responseBody));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}