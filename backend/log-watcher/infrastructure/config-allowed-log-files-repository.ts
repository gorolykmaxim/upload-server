import {AllowedLogFilesRepository} from "../domain/allowed-log-files-repository";
import {JsonDB} from "node-json-db";

export class ConfigAllowedLogFilesRepository implements AllowedLogFilesRepository {
    private static readonly LOGS_PATH: string = '/logs-view/logs';

    constructor(private jsonDB: JsonDB) {
    }

    initialize(): void {
        try {
            this.jsonDB.getData(ConfigAllowedLogFilesRepository.LOGS_PATH);
        } catch (e) {
            this.jsonDB.push(ConfigAllowedLogFilesRepository.LOGS_PATH, []);
        }
    }

    findAll(): Array<string> {
        return this.jsonDB.getData(ConfigAllowedLogFilesRepository.LOGS_PATH);
    }

    add(absolutePathToLogFile: string): void {
        const existingLogs: Array<string> = this.findAll();
        existingLogs.push(absolutePathToLogFile);
        this.jsonDB.push(ConfigAllowedLogFilesRepository.LOGS_PATH, existingLogs);
    }

    contains(absoluteLogFilePath: string): boolean {
        return this.findIndexOf(absoluteLogFilePath) >= 0;
    }

    remove(absolutePathToLogFile: string): void {
        const existingLogs: Array<string> = this.findAll();
        existingLogs.splice(this.findIndexOf(absolutePathToLogFile), 1);
        this.jsonDB.push(ConfigAllowedLogFilesRepository.LOGS_PATH, existingLogs);
    }

    private findIndexOf(absolutePathToLogFile: string): number {
        return this.findAll().indexOf(absolutePathToLogFile);
    }
}
