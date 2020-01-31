import {ArgumentsConsumer, EndpointWithArguments} from "../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../common/arguments";
import {Request, Response} from "express";
import {Collection, EntityNotFoundError} from "../../../common/collection/collection";
import {Endpoint} from "../../../common/api/endpoint";
import {FailableEndpoint} from "../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";

/**
 * Disallow the specified log file to be watched using the API.
 */
export class DisallowLog implements ArgumentsConsumer {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param allowedLogs collection, that contains absolute paths to log files, that are allowed to be watched
     */
    static create(allowedLogs: Collection<string>): Endpoint {
        const endpoint: ArgumentsConsumer = new DisallowLog(allowedLogs);
        const endpointWithArguments: EndpointWithArguments = new EndpointWithArguments(endpoint, 'query', ['absolutePath']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'disallow a log file to be watched');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        failableEndpoint.respondWithCodeOnErrorType(404, EntityNotFoundError);
        return failableEndpoint;
    }

    private constructor(private allowedLogs: Collection<string>) {
    }

    /**
     * {@inheritDoc}
     */
    async process(req: Request, res: Response): Promise<void> {
        const absoluteLogFilePath: string = this.args.get('absolutePath');
        console.info("%s receives a request to disallow a log '%s' to be watched", this, absoluteLogFilePath);
        await this.allowedLogs.remove(absoluteLogFilePath);
        res.end();
    }

    /**
     * {@inheritDoc}
     */
    setArguments(args: Arguments): void {
        this.args = args;
    }
}