import {Endpoint} from "../../../common/api/endpoint";
import {Request, Response} from "express";
import {Collection} from "../../../common/collection/collection";
import {ArgumentsConsumer, EndpointWithArguments} from "../../../common/api/endpoint-with-arguments";
import {Arguments} from "../../../common/arguments";
import {FileSystem} from "../../log/file-system";
import {FailableEndpoint} from "../../../common/api/failable-endpoint";
import {ArgumentError} from "common-errors";
import {WatchableLog} from "./watchable-log";

/**
 * Allow specified log file to be watched using the API.
 */
export class AllowLog implements ArgumentsConsumer, Endpoint {
    private args: Arguments;

    /**
     * Create an endpoint.
     *
     * @param allowedLogs collection, that contains absolute paths to log files, that are allowed to be watched
     * @param fileSystem file system, on which the log file is supposed to exist
     */
    static create(allowedLogs: Collection<string>, fileSystem: FileSystem): Endpoint {
        const endpoint: AllowLog = new AllowLog(allowedLogs, fileSystem);
        const endpointWithArguments: EndpointWithArguments = new EndpointWithArguments(endpoint, 'body', ['absolutePath']);
        const failableEndpoint: FailableEndpoint = new FailableEndpoint(endpointWithArguments, 'allow a log file to be watched');
        failableEndpoint.respondWithCodeOnErrorType(400, ArgumentError);
        return failableEndpoint;
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

    /**
     * {@inheritDoc}
     */
    toString() {
        return `AllowLog{args=${this.args}}`;
    }
}