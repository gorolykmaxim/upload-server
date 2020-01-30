import {instance, verify} from "ts-mockito";
import {Mocks} from "./mocks";
import {APIRequest} from "../../../../app/common/api/request";
import {DisallowLog} from "../../../../app/log-watcher/api/rest/disallow-log";

describe('DisallowLog', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = DisallowLog.create(instance(mocks.allowedLogs));
    });
    it('should disallow watching a log file', async function () {
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.allowedLogs.remove(mocks.absoluteLogFilePath)).once();
        verify(mocks.resMock.end()).once();
    });
});