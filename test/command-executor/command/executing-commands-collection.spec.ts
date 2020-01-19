import {EntityComparison} from "../../../app/common/collection/in-memory-collection";
import {CommandExecution} from "../../../app/command-executor/command/command-execution";
import {ExecutingCommandsComparison} from "../../../app/command-executor/command/executing-commands-collection";
import uuid = require("uuid");
import { expect } from "chai";

describe('ExecutingCommandsComparison', function () {
    const execution: CommandExecution = CommandExecution.finished(uuid(), 123456, null, null, null);
    const comparison: EntityComparison<CommandExecution> = new ExecutingCommandsComparison();
    it('should return true if both executions have the same start time and command ID', function () {
        // then
        expect(comparison.equal(execution, execution)).to.be.true;
    });
    it('should return false if executions have different command IDs', function () {
        // given
        const anotherExecution: CommandExecution = CommandExecution.finished(uuid(), execution.startTime, null, null, null);
        // then
        expect(comparison.equal(execution, anotherExecution)).to.be.false;
    });
    it('should return false if executions have different start times', function () {
        // given
        const anotherExecution: CommandExecution = CommandExecution.finished(execution.commandId, 67543, null, null, null);
        // then
        expect(comparison.equal(execution, anotherExecution)).to.be.false;
    });
    it('should return true if execution has specified command ID and start time', function () {
        // then
        expect(comparison.hasId(execution, {commandId: execution.commandId, startTime: execution.startTime})).to.be.true;
    });
    it('should return false if execution has different command ID', function () {
        // then
        expect(comparison.hasId(execution, {commandId: uuid(), startTime: execution.startTime})).to.be.false;
    });
    it('should return false if execution has different start time', function () {
        // then
        expect(comparison.hasId(execution, {commandId: execution.commandId, startTime: 765432})).to.be.false;
    });
});