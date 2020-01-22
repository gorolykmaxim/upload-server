import {CommandFactory} from "../../../app/command-executor/command/command-factory";
import uuid = require("uuid");
import {EOL} from "os";
import {Command} from "../../../app/command-executor/command/command";
import {CommandMapping} from "../../../app/command-executor/command/command-collection";
import { expect } from "chai";

describe('CommandMapping', function () {
    const factory: CommandFactory = new CommandFactory(null, () => uuid(), EOL, null);
    const command: Command = factory.create('list files', 'ls -lh');
    const mapping: CommandMapping = new CommandMapping(factory);
    it('should deserialize command', function () {
        // when
        const actualCommand: Command = mapping.deserialize({NAME: command.name, SCRIPT: command.script, ID: command.id});
        // then
        expect(actualCommand).to.eql(command);
    });
    it('should serialize command', function () {
        // when
        const object: any = mapping.serialize(command);
        // then
        expect(object).to.eql({
            'ID': command.id,
            'NAME': command.name,
            'SCRIPT': command.script
        });
    });
});