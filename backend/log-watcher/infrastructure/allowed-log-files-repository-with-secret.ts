import {AllowedLogFilesRepository} from "../domain/allowed-log-files-repository";

/**
 * A proxy to the actual {@link AllowedLogFilesRepository}, that also keeps secret log files, that are not allowed
 * to be seen, added or removed. The catch is that they are considered by the contains() call, so from the domain
 * perspective they are not listed anywhere, they can't be removed, but they can be watched and their size and content
 * can be read (sort of like an immutable logs).
 */
export class AllowedLogFilesRepositoryWithSecret implements AllowedLogFilesRepository {
    private secretLogs: Array<string> = [];

    constructor(private allowedLogFilesRepository: AllowedLogFilesRepository) {
    }

    addSecretLog(absolutePathToLogFile: string): void {
        if (!this.contains(absolutePathToLogFile)) {
            this.secretLogs.push(absolutePathToLogFile);
        }
    }

    add(absolutePathToLogFile: string): void {
        if (!this.allowedLogFilesRepository.contains(absolutePathToLogFile)) {
            this.allowedLogFilesRepository.add(absolutePathToLogFile);
        }
    }

    contains(absoluteLogFilePath: string): boolean {
        return this.allowedLogFilesRepository.contains(absoluteLogFilePath) || this.secretLogs.indexOf(absoluteLogFilePath) >= 0;
    }

    findAll(): Array<string> {
        return this.allowedLogFilesRepository.findAll();
    }

    remove(absolutePathToLogFile: string): void {
        if (this.allowedLogFilesRepository.contains(absolutePathToLogFile)) {
            this.allowedLogFilesRepository.remove(absolutePathToLogFile);
        }
    }
}
