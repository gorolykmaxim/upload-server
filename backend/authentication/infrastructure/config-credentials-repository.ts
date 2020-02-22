import {Credentials, CredentialsRepository} from "../domain/credentials";
import {JsonDB} from "node-json-db";

export class ConfigCredentialsRepository implements CredentialsRepository {
    private static readonly CREDENTIALS_PATH: string = '/authorization/credentials';

    constructor(private jsonDB: JsonDB) {
    }

    initialize(): void {
        try {
            this.jsonDB.getData(ConfigCredentialsRepository.CREDENTIALS_PATH);
        } catch (e) {
            this.jsonDB.push(ConfigCredentialsRepository.CREDENTIALS_PATH, Credentials.new());
        }
    }

    find(): Credentials {
        const rawCredentials: any = this.jsonDB.getData(ConfigCredentialsRepository.CREDENTIALS_PATH);
        return new Credentials(rawCredentials.login, rawCredentials.password);
    }
}
