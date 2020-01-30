import {instance, verify, when} from "ts-mockito";
import {Mocks} from "./mocks";
import {APIRequest} from "../../../../app/common/api/request";
import {FindAllowedLogs} from "../../../../app/log-watcher/api/rest/find-allowed-logs";

describe('FindAllowedLogs', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = FindAllowedLogs.create(instance(mocks.allowedLogs));
    });
    it('should find all log files, that are allowed to be watched', async function () {
        // given
        when(mocks.allowedLogs.findAll()).thenResolve([mocks.absoluteLogFilePath]);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify([mocks.expectedWatchableLog]))).once();
    });
});