import {Application} from "../backend/application";
import {FileSystem} from "../backend/uploader/domain/file-system";
import {anyOfClass, instance, mock, resetCalls, verify, when} from "ts-mockito";
import {Database} from "sqlite";
import * as request from "supertest";
import * as path from "path";
import {Observable} from "rxjs";

describe('uploader', function () {
    const error: Error = new Error('error');
    const fileContent: string = 'content of the file to upload';
    const baseUrl: string = '/api/uploader';
    const correctPath1: string = '/tmp/a';
    const correctPath2: string = '/tmp/b/c';
    const incorrectPath: string = '/etc/a/c';
    const uploadDirectory: string = '/tmp';
    const uploadUrls: Array<string> = ['/files/', '/files/upload', `${baseUrl}/file`];
    let application: Application;
    let database: Database;
    let fileSystem: FileSystem;
    beforeEach(async function () {
        fileSystem = mock<FileSystem>();
        database = mock<Database>();
        application = new Application(null, null, null, null, null,
            null, instance(database), instance(fileSystem), uploadDirectory);
        await application.main();
    });
    afterEach(function () {
        application.server.close();
    });
    it('should fail to upload raw body of the file due to missing file name', async function () {
        for (let url of uploadUrls) {
            // when
            await request(application.app)
                .post(url)
                .query({})
                .send(fileContent)
                .expect(400);
        }
    });
    it('should fail to upload raw body of the file outside the upload directory', async function () {
        for (let url of uploadUrls) {
            // when
            await request(application.app)
                .post(`${baseUrl}/file`)
                .query({name: incorrectPath})
                .send(fileContent)
                .expect(403);
        }
    });
    it('should fail to write file content to file system', async function () {
        // given
        when(fileSystem.writeToFile(correctPath1, anyOfClass(Observable))).thenReject(error);
        for (let url of uploadUrls) {
            // when
            await request(application.app)
                .post(`${baseUrl}/file`)
                .query({name: correctPath1})
                .send(fileContent)
                .expect(500);
        }
    });
    it('should upload raw body of the file', async function () {
        for (let url of uploadUrls) {
            // given
            resetCalls(fileSystem);
            // when
            await request(application.app)
                .post(`${baseUrl}/file`)
                .query({name: correctPath1})
                .send(fileContent)
                .expect(200);
            // then
            verify(fileSystem.writeToFile(correctPath1, anyOfClass(Observable))).once();
        }
    });
    it('should fail to move file since the old path is not specified', async function () {
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({})
            .expect(400);
    });
    it('should fail to move file since the new path is not specified', async function () {
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({oldPath: correctPath1})
            .expect(400);
    });
    it('should fail to move file since the old path is located outside the upload directory', async function () {
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({oldPath: incorrectPath, newPath: correctPath2})
            .expect(403);
    });
    it('should fail to move file since the new path is located outside the upload directory', async function () {
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({oldPath: correctPath1, newPath: incorrectPath})
            .expect(403);
    });
    it('should create a directory to which the file should be moved and move the file', async function () {
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({oldPath: correctPath1, newPath: correctPath2})
            .expect(200);
        // then
        verify(fileSystem.ensureDirectoryExists(path.dirname(correctPath2))).once();
        verify(fileSystem.move(correctPath1, correctPath2)).once();
    });
    it('should fail to move a file', async function () {
        // given
        when(fileSystem.move(correctPath1, correctPath2)).thenReject(error);
        // when
        await request(application.app)
            .put(`${baseUrl}/file`)
            .send({oldPath: correctPath1, newPath: correctPath2})
            .expect(500);
    });
    it('should fail to move file since the old path is not specified using old API', async function () {
        // when
        await request(application.app)
            .post('/files/move')
            .query({})
            .expect(400);
    });
    it('should fail to move file since the new path is not specified using old API', async function () {
        // when
        await request(application.app)
            .post('/files/move')
            .query({old_file: correctPath1})
            .expect(400);
    });
    it('should fail to move file since the old path is located outside the upload directory using old API', async function () {
        // when
        await request(application.app)
            .post('/files/move')
            .query({old_file: incorrectPath, file: correctPath2})
            .expect(403);
    });
    it('should fail to move file since the new path is located outside the upload directory using old API', async function () {
        // when
        await request(application.app)
            .post('/files/move')
            .query({old_file: correctPath1, file: incorrectPath})
            .expect(403);
    });
    it('should create a directory to which the file should be moved and move the file using old API', async function () {
        // when
        await request(application.app)
            .post('/files/move')
            .query({old_file: correctPath1, file: correctPath2})
            .expect(200);
        // then
        verify(fileSystem.ensureDirectoryExists(path.dirname(correctPath2))).once();
        verify(fileSystem.move(correctPath1, correctPath2)).once();
    });
    it('should fail to move a file using old API', async function () {
        // given
        when(fileSystem.move(correctPath1, correctPath2)).thenReject(error);
        // when
        await request(application.app)
            .post('/files/move')
            .query({old_file: correctPath1, file: correctPath2})
            .expect(500);
    });
});
