import {instance, verify, when} from "ts-mockito";
import {Mocks} from "./mocks";
import {Endpoint} from "../../../../app/common/api/endpoint";
import {FindAllowedLogs} from "../../../../app/log-watcher/api/rest/find-allowed-logs";

describe('FindAllowedLogs', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = FindAllowedLogs.create(instance(mocks.allowedLogs));
    });
    it('should find all log files, that are allowed to be watched', async function () {
        // given
        when(mocks.allowedLogs.findAll()).thenResolve([mocks.absoluteLogFilePath]);
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify([mocks.expectedWatchableLog]))).once();
    });
});