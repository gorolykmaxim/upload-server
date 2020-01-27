import {Command} from "../../../../../app/command-executor/command/command";
import {expect} from "chai";
import uuid = require("uuid");
import {ExecutableCommand} from "../../../../../app/command-executor/api/rest/command/executable-command";

describe('ExecutableCommand', function () {
    const command: Command = new Command(uuid(), 'list files', 'ls -lh', null, null, null);
    const executableCommand: ExecutableCommand = new ExecutableCommand(command);
    it('should create executable command with the specified ID', function () {
        // then
        expect(executableCommand.id).equal(command.id);
    });
    it('should create executable command with the specified name', function () {
        // then
        expect(executableCommand.name).equal(command.name);
    });
    it('should create executable command with the specified script', function () {
        // then
        expect(executableCommand.script).equal(command.script);
    });
});