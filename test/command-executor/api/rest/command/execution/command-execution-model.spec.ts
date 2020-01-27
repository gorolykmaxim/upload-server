import {CommandExecution, ExecutionStatus} from "../../../../../../app/command-executor/command/command-execution";
import {EOL} from "os";
import {expect} from "chai";
import uuid = require("uuid");
import {CommandExecutionModel} from "../../../../../../app/command-executor/api/rest/command/execution/command-execution-model";

describe('CommandExecutionModel', function () {
    const actualExecution: CommandExecution = CommandExecution.finished(
        uuid(),
        123456,
        ['line 1', 'line 2'],
        ExecutionStatus.finished,
        EOL
    );
    let execution: CommandExecutionModel = new CommandExecutionModel(actualExecution,true);
    it('should create execution with the specified command ID', function () {
        // then
        expect(execution.commandId).equal(actualExecution.commandId);
    });
    it('should create execution with the specified start time', function () {
        // then
        expect(execution.startTime).equal(actualExecution.startTime);
    });
    it('should create execution with the specified EOL', function () {
        // then
        expect(execution.eol).equal(actualExecution.eol);
    });
    it('should create execution with the specified output lines split into an array', function () {
        // when
        execution = new CommandExecutionModel(actualExecution, false);
        // then
        expect(execution.output).eql(actualExecution.getOutputLines());
    });
    it('should create execution with the specified output lines as a single string', function () {
        // when
        execution = new CommandExecutionModel(actualExecution, true);
        // then
        expect(execution.output).equal(actualExecution.getOutputAsString());
    });
    it('should create execution without output', function () {
        // when
        execution = new CommandExecutionModel(actualExecution);
        // then
        expect(execution.output).eql([]);
    });
});