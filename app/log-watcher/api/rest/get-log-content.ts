import {ArgumentsConsumer, RequestWithArguments} from "../../../common/api/request-with-arguments";
import {Arguments} from "../../../common/arguments";
import {Request, Response} from "express";
import {LogFile} from "../../log/log-file";
import {LogFilePool} from "../../log/log-file-pool";
import {APIRequest} from "../../../common/api/request";
import {DisposableRequest, FailableRequest} from "../../../common/api/failable-request";
import {ArgumentError} from "common-errors";
import {LogFileAccessError} from "../../log/restricted-log-file-pool";

/**
 * Get all the content of the specified log file.
 */
export class GetLogContent implements ArgumentsConsumer, DisposableRequest {
    private args: Arguments;
    private logFile: LogFile;

    /**
     * Create a request.
     *
     * @param logFilePool pool of log files, to obtain the log file from
     */
    static create(logFilePool: LogFilePool): APIRequest {
        const request: GetLogContent = new GetLogContent(logFilePool);
        const requestWithArguments: RequestWithArguments = new RequestWithArguments(request, 'query', ['absolutePath']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'read content of a log file', request);
        failableRequest.respondWithCodeOnErrorType(400, ArgumentError);
        failableRequest.respondWithCodeOnErrorType(403, LogFileAccessError);
        return failableRequest;
    }

    private constructor(private logFilePool: LogFilePool) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const absoluteLogFilePath: string = this.args.get('absolutePath');
        const noSplit: boolean = req.query.noSplit || false;
        console.info("%s receives a request to read content of log '%s'. Content will be split into lines - %s", this, absoluteLogFilePath, noSplit);
        this.logFile = await this.logFilePool.getLog(absoluteLogFilePath);
        const response = {content: noSplit ? await this.logFile.getContentAsString() : await this.logFile.getContentLines()};
        res.end(JSON.stringify(response));
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }

    /**
     * {@inheritDoc}
     */
    async dispose(): Promise<void> {
        if (this.logFile) {
            await this.logFilePool.disposeIfNecessary(this.logFile);
        }
    }
}