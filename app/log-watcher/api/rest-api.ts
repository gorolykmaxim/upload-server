import {Application, Request, Response} from "express";
import {Collection, EntityNotFoundError} from "../../common/collection/collection";
import {LogFile} from "../log/log-file";
import {FileSystem} from "../log/file-system";
import {URL} from "../../common/url";
import {WatchableLog} from "./watchable-log";
import {LogFilePool} from "../log/log-file-pool";
import {ArgumentError} from "common-errors";
import {LogFileAccessError} from "../log/restricted-log-file-pool";

/**
 * REST API of a log-watcher.
 * Contains following endpoints:
 * - GET /log - get list of all log files, that are allowed to be watched
 * - GET /log/size - get size of the log file, specified in "absolutePath" query parameter (the log file must be allowed
 * to be watched)
 * - GET /log/content - get content of the log file, specified in "absolutePath" query parameter (the log file must be
 * allowed to be watched). "noSplit" query parameter, set to true, will make content not-split-into-lines in the
 * response.
 * - POST /log - allow log, specified in "absolutePath" body request parameter, to be watched
 * - DELETE /log - disallow log, specified in "absolutePath" query parameter, to be watched
 */
export class RestAPI {
    private readonly logURL: URL;
    private readonly logSizeURL: URL;
    private readonly logContentURL: URL;

    /**
     * Construct an API.
     *
     * @param baseURL base URL of all endpoints of the API
     * @param server server, on which the API will listen to requests
     * @param allowedLogs collection, where API will store absolute paths to log files, that are allowed to be watched
     * @param logFilePool log file pool, where API will obtain log files to get their content and size
     * @param fileSystem file system, where API will look for log files, that are going to be allowed to be watched, to
     * check if they are accessible or not beforehand
     */
    constructor(baseURL: URL, server: Application, private allowedLogs: Collection<string>,
                private logFilePool: LogFilePool, private fileSystem: FileSystem) {
        this.logURL = baseURL.append('log');
        this.logSizeURL = this.logURL.append('size');
        this.logContentURL = this.logURL.append('content');
        server.get(this.logURL.value, this.findAllowedLogs.bind(this));
        server.get(this.logSizeURL.value, this.getLogSize.bind(this));
        server.get(this.logContentURL.value, this.getLogContent.bind(this));
        server.post(this.logURL.value, this.addAllowedLog.bind(this));
        server.delete(this.logURL.value, this.removeAllowedLog.bind(this));
    }

    private async findAllowedLogs(req: Request, res: Response): Promise<void> {
        try {
            console.info("%s receives a request to find all logs, that are allowed to be watched", this);
            const allowedLogs: Array<string> = await this.allowedLogs.findAll();
            const watchableLogs: Array<WatchableLog> = allowedLogs.map(al => new WatchableLog(al, this.logURL, this.logSizeURL, this.logContentURL));
            res.end(JSON.stringify(watchableLogs));
        } catch (e) {
            res.status(500).end(APIError.allowedLogsLookup(e).message);
        }
    }

    private async addAllowedLog(req: Request, res: Response): Promise<void> {
        let absoluteLogFilePath: string;
        try {
            absoluteLogFilePath = req.body.absolutePath;
            console.info("%s receives a request to allow a log '%s' to be watched", this, absoluteLogFilePath);
            if (!absoluteLogFilePath) {
                throw new ArgumentError("absolutePath");
            }
            let responseBody = new WatchableLog(absoluteLogFilePath, this.logURL, this.logSizeURL, this.logContentURL);
            if (!await this.allowedLogs.contains(absoluteLogFilePath)) {
                await this.allowedLogs.add(absoluteLogFilePath);
            }
            try {
                await this.fileSystem.accessAsync(absoluteLogFilePath);
            } catch (e) {
                responseBody = Object.assign({notice: 'At this moment the log either does not exist or is inaccessible.'}, responseBody);
            }
            res.end(JSON.stringify(responseBody));
        } catch (e) {
            const code = e instanceof ArgumentError ? 400 : 500;
            res.status(code).end(APIError.allowedLogAddition(absoluteLogFilePath, e).message);
        }
    }

    private async removeAllowedLog(req: Request, res: Response): Promise<void> {
        let absoluteLogFilePath: string;
        try  {
            absoluteLogFilePath = req.query.absolutePath;
            if (!absoluteLogFilePath) {
                throw new ArgumentError("absolutePath");
            }
            console.info("%s receives a request to disallow a log '%s' to be watched", this, absoluteLogFilePath);
            await this.allowedLogs.remove(absoluteLogFilePath);
            res.end();
        } catch (e) {
            let code;
            if (e instanceof ArgumentError) {
                code = 400;
            } else if (e instanceof EntityNotFoundError) {
                code = 404;
            } else {
                code = 500;
            }
            res.status(code).end(APIError.allowedLogRemoval(absoluteLogFilePath, e).message);
        }
    }

    private async getLogSize(req: Request, res: Response): Promise<void> {
        let absoluteLogFilePath: string;
        let logFile: LogFile;
        try {
            absoluteLogFilePath = req.query.absolutePath;
            if (!absoluteLogFilePath) {
                throw new ArgumentError("absolutePath");
            }
            console.info("%s receives a request to read size of log '%s'", this, absoluteLogFilePath);
            logFile = await this.logFilePool.getLog(absoluteLogFilePath);
            const sizeInBytes = await logFile.getContentSize();
            res.end(JSON.stringify({sizeInBytes}));
        } catch (e) {
            let code;
            if (e instanceof ArgumentError) {
                code = 400;
            } else if (e instanceof LogFileAccessError) {
                code = 403;
            } else {
                code = 500;
            }
            res.status(code).end(APIError.logSize(absoluteLogFilePath, e).message);
        } finally {
            if (logFile) {
                await this.logFilePool.disposeIfNecessary(logFile);
            }
        }
    }

    private async getLogContent(req: Request, res: Response): Promise<void> {
        let absoluteLogFilePath: string;
        let logFile: LogFile;
        try {
            absoluteLogFilePath = req.query.absolutePath;
            if (!absoluteLogFilePath) {
                throw new ArgumentError("absolutePath");
            }
            const noSplit: boolean = req.query.noSplit || false;
            console.info("%s receives a request to read content of log '%s'. Content will be split into lines - %s", this, absoluteLogFilePath, noSplit);
            logFile = await this.logFilePool.getLog(absoluteLogFilePath);
            const response = {content: noSplit ? await logFile.getContentAsString() : await logFile.getContentLines()};
            res.end(JSON.stringify(response));
        } catch (e) {
            let code;
            if (e instanceof ArgumentError) {
                code = 400;
            } else if (e instanceof LogFileAccessError) {
                code = 403;
            } else {
                code = 500;
            }
            res.status(code).end(APIError.logContent(absoluteLogFilePath, e).message);
        } finally {
            if (logFile) {
                await this.logFilePool.disposeIfNecessary(logFile);
            }
        }
    }

    toString() {
        return `RestAPI{logURL=${this.logURL}, logSizeURL=${this.logSizeURL}, logContentURL=${this.logContentURL}}`;
    }
}

/**
 * An error that might occurs in the log-watcher REST API, while processing a request.
 */
export class APIError extends Error {
    /**
     * Failed to find log files, that are allowed to be watched.
     *
     * @param cause reason of a failure
     */
    static allowedLogsLookup(cause: Error): APIError {
        return new APIError('Failed to lookup logs, that are allowed to be watched', cause)
    }

    /**
     * Failed to allow a log file to be watched.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason of a failure
     */
    static allowedLogAddition(absoluteLogFilePath: string, cause: Error): APIError {
        return new APIError(`Failed to allow a log file '${absoluteLogFilePath}' to be watched`, cause);
    }

    /**
     * Failed to disallow a log file to be watched.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason of a failure
     */
    static allowedLogRemoval(absoluteLogFilePath: string, cause: Error): APIError {
        return new APIError(`Failed to disallow a log file '${absoluteLogFilePath}' to be watched`, cause);
    }

    /**
     * Failed to read size of a log file.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason of a failure
     */
    static logSize(absoluteLogFilePath: string, cause: Error): APIError {
        return new APIError(`Failed to read the size of '${absoluteLogFilePath}'`, cause);
    }

    /**
     * Failed to read content of a log file.
     *
     * @param absoluteLogFilePath absolute path to the log file
     * @param cause reason of a failure
     */
    static logContent(absoluteLogFilePath: string, cause: Error): APIError {
        return new APIError(`Failed to read content of '${absoluteLogFilePath}'`, cause);
    }

    /**
     * Construct an error.
     *
     * @param message error message
     * @param cause error root cause
     */
    constructor(message: string, cause: Error) {
        super(`${message}. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, APIError.prototype);
    }
}