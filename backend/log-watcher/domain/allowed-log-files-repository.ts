export interface AllowedLogFilesRepository {
    findAll(): Array<string>;
    contains(absoluteLogFilePath: string): boolean;
    add(absolutePathToLogFile: string): void;
    remove(absolutePathToLogFile: string): void;
}
