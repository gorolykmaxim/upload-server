import {CommandExecution, ExecutionStatus} from "../../../app/command-executor/command/command-execution";
import {OutputChangedEvent, StatusChangedEvent} from "../../../app/command-executor/api/events";
import {EOL} from "os";
import { expect } from "chai";

const newStatus: ExecutionStatus = ExecutionStatus.finished;

describe('StatusChangedEvent', function () {
    const execution: CommandExecution = CommandExecution.finished('12345', 12345, [], newStatus, EOL);
    const event: StatusChangedEvent = new StatusChangedEvent(execution, newStatus);
    it('should create status changed event with ID of the command', function () {
        // then
        expect(event.commandId).equal(execution.commandId);
    });
    it('should create status changed event with start time of the execution', function () {
        // then
        expect(event.startTime).equal(execution.startTime);
    });
    it('should create status changed event with a corresponding type', function () {
        // then
        expect(event.type).equal('status');
    });
    it('should create status changed event with a new status', function () {
        // then
        expect(event.newStatus).equal('finished');
    });
});

describe('OutputChangedEvent', function () {
    const output: Array<string> = ['line 1', 'line 2'];
    const execution: CommandExecution = CommandExecution.finished('12345', 12345, [], newStatus, EOL);
    const event: OutputChangedEvent = new OutputChangedEvent(execution, output);
    it('should create output changed event with ID of the command', function () {
        // then
        expect(event.commandId).equal(execution.commandId);
    });
    it('should create output changed event with start time of the execution', function () {
        // then
        expect(event.startTime).equal(execution.startTime);
    });
    it('should create output changed event with a corresponding type', function () {
        // then
        expect(event.type).equal('output');
    });
    it('should create output changed event with an output change', function () {
        // then
        expect(event.changes).equal(output);
    });
});