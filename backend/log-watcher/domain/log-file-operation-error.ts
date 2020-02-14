export class LogFileOperationError extends Error {
    constructor(operation: string, absolutePathToLogFile: string, cause: Error) {
        super(`Failed to ${operation} log file ${absolutePathToLogFile}. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, LogFileOperationError.prototype);
    }
}
