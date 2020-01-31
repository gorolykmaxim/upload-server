import {ArgumentsConsumer, EndpointWithArguments} from "../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../common/arguments";
import {Request, Response} from "express";
import {LogFile} from "../../log/log-file";
import {LogFilePool} from "../../log/log-file-pool";
import {Endpoint} from "../../../common/api/endpoint";
import {DisposableEndpoint, FailableEndpoint} from "../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";
import {LogFileAccessError} from "../../log/restricted-log-file-pool";

/**
 * Get all the content of the specified log file.
 */
export class GetLogContent implements ArgumentsConsumer, DisposableEndpoint {
    private args: Arguments;
    private logFile: LogFile;

    /**
     * Create an endpoint.
     *
     * @param logFilePool pool of log files, to obtain the log file from
     */
    static create(logFilePool: LogFilePool): Endpoint {
        const endpoint: GetLogContent = new GetLogContent(logFilePool);
        const endpointWithArguments: EndpointWithArguments = new EndpointWithArguments(endpoint, 'query', ['absolutePath']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'read content of a log file', endpoint);
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(403, LogFileAccessError);
        return failableEndpoint;
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