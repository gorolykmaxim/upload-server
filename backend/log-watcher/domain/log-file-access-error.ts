export class LogFileAccessError extends Error {
    constructor(absolutePathToLogFile: string) {
        super(`Access to ${absolutePathToLogFile} is forbidden`);
        Object.setPrototypeOf(this, LogFileAccessError.prototype);
    }
}
