import {ArgumentsConsumer, EndpointWithArguments} from "../../../common/api/endpoint-with-arguments";
import {DisposableEndpoint, FailableEndpoint} from "../../../common/api/failable-endpoint";
import {Arguments} from "../../../common/arguments";
import {Request, Response} from "express";
import {LogFile} from "../../log/log-file";
import {LogFilePool} from "../../log/log-file-pool";
import {Endpoint} from "../../../common/api/endpoint";
import {ArgumentError} from "common-errors";
import {LogFileAccessError} from "../../log/restricted-log-file-pool";

/**
 * Get the size of the specified log file in bytes.
 */
export class GetLogSize implements ArgumentsConsumer, DisposableEndpoint{
    private args: Arguments;
    private logFile: LogFile;

    /**
     * Create an endpoint.
     *
     * @param logFilePool pool of log files, to obtain the log file from
     */
    static create(logFilePool: LogFilePool): Endpoint {
        const endpoint: GetLogSize = new GetLogSize(logFilePool);
        const endpointWithArguments: EndpointWithArguments = new EndpointWithArguments(endpoint, 'query', ['absolutePath']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'read size of a log file', endpoint);
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