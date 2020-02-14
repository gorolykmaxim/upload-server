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
}
