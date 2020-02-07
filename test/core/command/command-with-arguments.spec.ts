import {Observable, Subscriber} from "rxjs";
import {expect} from "chai";
import {ArgumentError} from "common-errors";
import {Command} from "../../../backend/core/command/command";
import {ArgumentsConsumer, CommandWithArguments} from "../../../backend/core/command/command-with-arguments";

class DummyCommand extends Command implements ArgumentsConsumer {
    public isExecuted: boolean = false;

    constructor(public readonly mandatoryArgs: Array<string>) {
        super();
    }

    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.isExecuted = true;
    }

}

describe('CommandWithArguments', function () {
    const mandatoryArgs: Array<string> = ['a', 'c'];
    const args: any = {'a': 'b', 'c': 'd'};
    let actualCommand: DummyCommand;
    let command: Command;
    beforeEach(function () {
        actualCommand = new DummyCommand(mandatoryArgs);
        command = new CommandWithArguments(actualCommand);
    });
    it('should execute actual command since all the mandatory arguments are in place', async function () {
        // when
        await command.execute(null, args);
        // then
        expect(actualCommand.isExecuted).true;
    });
    it('should throw an error since some of the mandatory arguments are missing', async function () {
        // then
        await expect(command.execute(null, {})).rejectedWith(ArgumentError);
    });
    it('should throw an error if arguments were not specified but there are mandatory arguments', async function () {
        // then
        await expect(command.execute(null)).rejectedWith(ArgumentError);
    });
    it('should not throw an error if arguments were not specified since there are no mandatory arguments anyway', async function () {
        // given
        actualCommand = new DummyCommand([]);
        command = new CommandWithArguments(actualCommand);
        // when
        await command.execute(null);
        // then
        expect(actualCommand.isExecuted).true;
    });
});
