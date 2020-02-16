import {Database} from "sqlite";
import {JsonDB} from "node-json-db";
import {Application} from "../backend/application";
import {capture, instance, mock, when} from "ts-mockito";
import {expect} from "chai";

describe('authentication', async function () {
    const configPath: string = '/authorization/credentials';
    let database: Database;
    let jsonDB: JsonDB;
    let application: Application;
    beforeEach(async function () {
        database = mock<Database>();
        jsonDB = mock(JsonDB);
        when(jsonDB.getData(configPath))
            .thenThrow(new Error())
            .thenReturn({login: '1', password: '2'});
        application = new Application(null, instance(jsonDB), null, null, null,
            null, instance(database), null, null);
        application.debug = true;
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should create new credentials and save them to the config', async function () {
        // then
        const credentials: any = capture(jsonDB.push).first()[1];
        expect(credentials.login).not.null;
        expect(credentials.password).not.null;
        expect(credentials.login).not.equal(credentials.password);
    });
});
