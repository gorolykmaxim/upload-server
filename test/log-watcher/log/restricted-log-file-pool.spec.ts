import {Collection} from "../../../app/collection/collection";
import {LogFile} from "../../../app/log-watcher/log/log-file";
import {LogFileFactory} from "../../../app/log-watcher/log/log-file-factory";
import {LogFilePool} from "../../../app/log-watcher/log/log-file-pool";
import {ValuesCollection} from "../../../app/collection/values-collection";
import {instance, mock, when} from "ts-mockito";
import {LogFileAccessError, RestrictedLogFilePool} from "../../../app/log-watcher/log/restricted-log-file-pool";
import { expect } from "chai";
import * as chai from "chai";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('RestrictedLogFilePool', function () {
    const absoluteLogFilePath = '/var/log/messages';
    const logFile: LogFile = new LogFile(absoluteLogFilePath, null);
    let allowedLogFiles: Collection<string>;
    let logFiles: Collection<LogFile>;
    let factory: LogFileFactory;
    let pool: LogFilePool;
    beforeEach(function () {
        allowedLogFiles = new ValuesCollection();
        logFiles = mock<Collection<LogFile>>();
        factory = mock<LogFileFactory>();
        when(logFiles.contains(absoluteLogFilePath)).thenResolve(true);
        when(logFiles.findById(absoluteLogFilePath)).thenResolve(logFile);
        pool = new RestrictedLogFilePool(allowedLogFiles, instance(logFiles), instance(factory));
    });
    it('should return log file with the specified absolute path', async function () {
        // given
        await allowedLogFiles.add(absoluteLogFilePath);
        // when
        const actualLogFile: LogFile = await pool.getLog(absoluteLogFilePath);
        // then
        expect(actualLogFile).to.equal(logFile);
    });
    it('should not return log file since the specified absolute path is not in the list of allowed ones', async function () {
        // then
        await expect(pool.getLog(absoluteLogFilePath)).to.be.rejectedWith(LogFileAccessError);
    });
});