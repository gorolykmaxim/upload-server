import {instance, verify, when} from "ts-mockito";
import {Mocks} from "./mocks";
import {Endpoint} from "../../../../app/common/api/endpoint";
import {GetLogSize} from "../../../../app/log-watcher/api/rest/get-log-size";

describe('GetLogSize', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = GetLogSize.create(instance(mocks.logFilePool));
    });
    it('should obtain log file from pool, read its size, dispose log file in pool and return its size', async function () {
        // given
        const expectedSize = 15;
        when(mocks.logFileMock.getContentSize()).thenResolve(expectedSize);
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.logFilePool.disposeIfNecessary(mocks.logFile)).once();
        verify(mocks.resMock.end(JSON.stringify({sizeInBytes: expectedSize}))).once();
    });
});