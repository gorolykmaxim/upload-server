import {ArgumentsConsumer, RequestWithArguments} from "../../../common/api/request-with-arguments";
import {DisposableRequest, FailableRequest} from "../../../common/api/failable-request";
import {Arguments} from "../../../common/arguments";
import {Request, Response} from "express";
import {LogFile} from "../../log/log-file";
import {LogFilePool} from "../../log/log-file-pool";
import {APIRequest} from "../../../common/api/request";
import {ArgumentError} from "common-errors";
import {LogFileAccessError} from "../../log/restricted-log-file-pool";

/**
 * Get the size of the specified log file in bytes.
 */
export class GetLogSize implements ArgumentsConsumer, DisposableRequest{
    private args: Arguments;
    private logFile: LogFile;

    /**
     * Create a request.
     *
     * @param logFilePool pool of log files, to obtain the log file from
     */
    static create(logFilePool: LogFilePool): APIRequest {
        const request: GetLogSize = new GetLogSize(logFilePool);
        const requestWithArguments: RequestWithArguments = new RequestWithArguments(request, 'query', ['absolutePath']);
        const failableRequest: FailableRequest = new FailableRequest(requestWithArguments, 'read size of a log file', request);
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
        console.info("%s receives a request to read size of log '%s'", this, absoluteLogFilePath);
        this.logFile = await this.logFilePool.getLog(absoluteLogFilePath);
        const sizeInBytes = await this.logFile.getContentSize();
        res.end(JSON.stringify({sizeInBytes}));
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