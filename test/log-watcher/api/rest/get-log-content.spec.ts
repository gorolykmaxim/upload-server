import {instance, verify, when} from "ts-mockito";
import {Mocks} from "./mocks";
import {APIRequest} from "../../../../app/common/api/request";
import {GetLogContent} from "../../../../app/log-watcher/api/rest/get-log-content";

describe('GetLogContent', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = GetLogContent.create(instance(mocks.logFilePool));
    });
    it('should obtain log file from pool, read its content, while splitting it in lines, dispose log file in pool and return its content', async function () {
        // given
        const expectedContent = ['log entry 1', 'log entry 2'];
        when(mocks.logFileMock.getContentLines()).thenResolve(expectedContent);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.logFilePool.disposeIfNecessary(mocks.logFile)).once();
        verify(mocks.resMock.end(JSON.stringify({content: expectedContent}))).once();
    });
    it('should obtain log file from pool, read its content, while not splitting it in lines, dispose log file in pool and return its content', async function () {
        // given
        const expectedContent = 'log entry1\nlog entry 2';
        mocks.req.query.noSplit = true;
        when(mocks.logFileMock.getContentAsString()).thenResolve(expectedContent);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.logFilePool.disposeIfNecessary(mocks.logFile)).once();
        verify(mocks.resMock.end(JSON.stringify({content: expectedContent}))).once();
    });
});