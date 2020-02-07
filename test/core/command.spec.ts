import {ArgumentsConsumer, Command, CommandExecutor, CommandWithArguments} from "../../backend/core/command";
import {Observable, Subscriber} from "rxjs";
import * as chai from "chai";
import {expect} from "chai";
import {ArgumentError} from "common-errors";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

class DummyCommand extends Command {
    executionCount: number = 0;

    constructor(private throwError: boolean = false, private complete: boolean = true) {
        super();
    }

    get isExecuted(): boolean {
        return this.executionCount > 0;
    }

    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.executionCount++;
        if (this.throwError) {
            output.error(new Error('error'));
        } else if (this.complete) {
            output.complete();
        } else {
            output.next({});
        }
    }
}

describe('CommandExecutor', function () {
    const childCommandName: string = 'child command';
    let executor: CommandExecutor;
    let command: Command;
    let childCommand: DummyCommand;
    beforeEach(function () {
        executor = new CommandExecutor();
        command = new DummyCommand();
        childCommand = new DummyCommand();
        executor.register(childCommandName, childCommand);
        executor.register('actual command', command);
    });
    it('should schedule execution of the specified command', function () {
        // when
        command.schedule(childCommandName).subscribe();
        // then
        expect(childCommand.isExecuted).true;
    });
    it('should schedule execution of the specified command without subscribing to its output', function () {
        // when
        command.scheduleAndForget(childCommandName);
        // then
        expect(childCommand.isExecuted).true;
    });
    it('should execute command only once even if there are multiple subscribers', function () {
        // when
        const output: Observable<any> = command.schedule(childCommandName);
        output.subscribe();
        output.subscribe();
        // then
        expect(childCommand.executionCount).equal(1);
    });
    it('should catch error, happened in the child command and forward it to its output', async function () {
        // given
        executor.register(childCommandName, new DummyCommand(true));
        // when
        const output: Observable<any> = executor.execute(childCommandName);
        // then
        await expect(output.toPromise()).rejectedWith(Error);
    });
    it('should complete the output of the command if the command does not do it by itself', function (done) {
        // given
        executor.register(childCommandName, new DummyCommand(false, false));
        // when
        const output: Observable<any> = executor.execute(childCommandName);
        // then
        output.subscribe({complete: done});
    });
});

class DummyArgumentConsumer extends Command implements ArgumentsConsumer {
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
    let actualCommand: DummyArgumentConsumer;
    let command: Command;
    beforeEach(function () {
        actualCommand = new DummyArgumentConsumer(mandatoryArgs);
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
        actualCommand = new DummyArgumentConsumer([]);
        command = new CommandWithArguments(actualCommand);
        // when
        await command.execute(null);
        // then
        expect(actualCommand.isExecuted).true;
    });
});
