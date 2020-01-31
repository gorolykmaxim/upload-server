import {instance, verify} from "ts-mockito";
import {Mocks} from "./mocks";
import {Endpoint} from "../../../../app/common/api/endpoint";
import {DisallowLog} from "../../../../app/log-watcher/api/rest/disallow-log";

describe('DisallowLog', function () {
    let mocks: Mocks;
    let endpoint: Endpoint;
    beforeEach(function () {
        mocks = new Mocks();
        endpoint = DisallowLog.create(instance(mocks.allowedLogs));
    });
    it('should disallow watching a log file', async function () {
        // when
        await endpoint.process(mocks.req, mocks.res);
        // then
        verify(mocks.allowedLogs.remove(mocks.absoluteLogFilePath)).once();
        verify(mocks.resMock.end()).once();
    });
});