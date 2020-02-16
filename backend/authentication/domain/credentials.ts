import * as md5 from "md5";

export class Credentials {
    static new(): Credentials {
        return new Credentials(md5((Date.now() + 1000).toString()), md5((Date.now() - 1000).toString()));
    }

    constructor(readonly login: string, readonly password: string) {
    }
}

export interface CredentialsRepository {
    find(): Credentials;
}
