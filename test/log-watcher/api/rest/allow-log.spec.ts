import {Mocks} from "./mocks";
import {APIRequest} from "../../../../app/common/api/request";
import {AllowLog} from "../../../../app/log-watcher/api/rest/allow-log";
import {instance, verify, when} from "ts-mockito";

describe('AllowLog', function () {
    let mocks: Mocks;
    let request: APIRequest;
    beforeEach(function () {
        mocks = new Mocks();
        request = AllowLog.create(instance(mocks.allowedLogs), instance(mocks.fileSystem));
    });
    it('should allow watching a log file', async function () {
        // given
        when(mocks.allowedLogs.contains(mocks.absoluteLogFilePath)).thenResolve(false);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.allowedLogs.add(mocks.absoluteLogFilePath)).once();
        verify(mocks.resMock.end(JSON.stringify(mocks.expectedWatchableLog))).once();
    });
    it('should not add the same log file to the list of allowed log files twice, but should not fail the request either', async function () {
        // given
        when(mocks.allowedLogs.contains(mocks.absoluteLogFilePath)).thenResolve(true);
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.allowedLogs.add(mocks.absoluteLogFilePath)).never();
        verify(mocks.resMock.end(JSON.stringify(mocks.expectedWatchableLog))).once();
    });
    it('should notify client about the fact that the allowed log file does not exist', async function () {
        // given
        const expectedNotice = 'At this moment the log either does not exist or is inaccessible.';
        when(mocks.allowedLogs.contains(mocks.absoluteLogFilePath)).thenResolve(false);
        when(mocks.fileSystem.accessAsync(mocks.absoluteLogFilePath)).thenReject(new Error());
        // when
        await request.process(mocks.req, mocks.res);
        // then
        verify(mocks.resMock.end(JSON.stringify(Object.assign({notice: expectedNotice}, mocks.expectedWatchableLog)))).once();
    });
});