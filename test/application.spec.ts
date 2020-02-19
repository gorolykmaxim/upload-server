import {instance, mock} from "ts-mockito";
import {Database} from "sqlite";
import {Application} from "../backend/application";
import * as request from "supertest";

describe('application', function () {
    let database: Database;
    let application: Application;
    beforeEach(async function () {
        database = mock<Database>();
        application = new Application(null, null, null, null, null,
            null, instance(database), null, null);
        application.debug = true;
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should return information about the applications configuration', async function () {
        // when
        await request(application.app)
            .get('/api/config')
            .expect(200, {
                isInAdminMode: false,
                logFile: 'upload-server.log'
            })
    });
});
