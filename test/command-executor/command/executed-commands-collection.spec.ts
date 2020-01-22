import {CommandExecution, ExecutionStatus} from "../../../app/command-executor/command/command-execution";
import uuid = require("uuid");
import {EOL} from "os";
import {CommandExecutionMapping} from "../../../app/command-executor/command/executed-commands-collection";
import { expect } from "chai";

describe('CommandExecutionMapping', function () {
    let execution: CommandExecution = CommandExecution.finished(uuid(), Date.now(), ['line 1', 'line 2'], ExecutionStatus.finished, EOL);
    const mapping: CommandExecutionMapping = new CommandExecutionMapping();
    it('should deserialize finished command execution', function () {
        // when
        const actualExecution: CommandExecution = mapping.deserialize({
            'COMMAND_ID': execution.commandId,
            'START_TIME': execution.startTime,
            'OUTPUT': execution.getOutputAsString(),
            'END_OF_LINE': execution.eol,
            'STATUS': 0
        });
        // then
        expect(actualExecution).to.eql(execution);
    });
    it('should serialize finished command execution', function () {
        // when
        const object: any = mapping.serialize(execution);
        // then
        expect(object).to.eql({
            'COMMAND_ID': execution.commandId,
            'START_TIME': execution.startTime,
            'OUTPUT': execution.getOutputAsString(),
            'END_OF_LINE': execution.eol,
            'STATUS': 0
        });
    });
    it('should deserialize failed command execution', function () {
        // given
        execution = CommandExecution.finished(uuid(), Date.now(), ['line 1', 'line 2'], ExecutionStatus.failed, EOL);
        // when
        const actualExecution: CommandExecution = mapping.deserialize({
            'COMMAND_ID': execution.commandId,
            'START_TIME': execution.startTime,
            'OUTPUT': execution.getOutputAsString(),
            'END_OF_LINE': execution.eol,
            'STATUS': 1
        });
        // then
        expect(actualExecution).to.eql(execution);
    });
    it('should serialize failed command execution', function () {
        // given
        execution = CommandExecution.finished(uuid(), Date.now(), ['line 1', 'line 2'], ExecutionStatus.failed, EOL);
        // when
        const object: any = mapping.serialize(execution);
        // then
        expect(object).to.eql({
            'COMMAND_ID': execution.commandId,
            'START_TIME': execution.startTime,
            'OUTPUT': execution.getOutputAsString(),
            'END_OF_LINE': execution.eol,
            'STATUS': 1
        });
    });
});