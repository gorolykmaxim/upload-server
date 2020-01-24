import {URL} from "../../../app/common/url";
import {CommandURL} from "../../../app/command-executor/api/command-url";
import {expect} from "chai";
import {CommandExecutionURL} from "../../../app/command-executor/api/command-execution-url";

describe('CommandExecutionURL', function () {
    const commandId: string = '12345';
    let baseURL: URL = URL.createNew('api').append('command-executor');
    baseURL = CommandURL.singleCommand(baseURL).setCommandId(commandId);
    it('should create an execution URL that is not related to a specific execution', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.allExecutions(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution`);
    });
    it('should create an execution URL that is related to a specific execution', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.singleExecution(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/:startTime`);
    });
    it('should create an execution termination URL', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.terminateExecution(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/:startTime/terminate`);
    });
    it('should create an execution halt URL', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.haltExecution(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/:startTime/halt`);
    });
    it('should create an execution status URL', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.executionStatus(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/:startTime/status`);
    });
    it('should create an execution output URL', function () {
        // when
        const url: CommandExecutionURL = CommandExecutionURL.executionOutput(baseURL);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/:startTime/output`);
    });
    it('should create a URL for an execution with a specific start time', function () {
        // given
        const startTime: number = 123454;
        // when
        const url: CommandExecutionURL = CommandExecutionURL.singleExecution(baseURL).setExecutionStartTime(startTime);
        // then
        expect(url.value).equal(`/api/command-executor/command/${commandId}/execution/${startTime}`);
    });
});