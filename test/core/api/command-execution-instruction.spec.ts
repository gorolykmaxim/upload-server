import {CommandExecutionInstruction} from "../../../backend/core/api/command-execution-instruction";
import {Argument, ArgumentType} from "../../../backend/core/api";
import { expect } from "chai";
import {LinkedList} from "typescript-collections";

describe('CommandExecutionInstruction', function () {
    const source: string = 'some argument source';
    const commandName: string = 'command name';
    const firstArgument: Argument = new Argument('first argument', ArgumentType.object);
    const secondArgument: Argument = new Argument('second argument', ArgumentType.object);
    let instruction: CommandExecutionInstruction;
    beforeEach(function () {
        instruction = new CommandExecutionInstruction(commandName);
    });
    it('should add first argument to a source', function () {
        for (let isMandatory of [true, false]) {
            // when
            instruction.addArgument(source, isMandatory, firstArgument);
            // then
            const args: LinkedList<Argument> = instruction.getArguments(source, isMandatory);
            expect(args.contains(firstArgument)).true;
        }
    });
    it('should add second argument to a source', function () {
        for (let isMandatory of [true, false]) {
            // given
            instruction.addArgument(source, isMandatory, firstArgument);
            // when
            instruction.addArgument(source, isMandatory, secondArgument);
            // then
            const args: LinkedList<Argument> = instruction.getArguments(source, isMandatory);
            expect(args.contains(firstArgument)).true;
            expect(args.contains(secondArgument)).true;
        }
    });
});
