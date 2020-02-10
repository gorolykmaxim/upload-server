import * as chai from "chai";
import {from, Observable, Subscriber} from "rxjs";
import {expect} from "chai";
import chaiAsPromised = require("chai-as-promised");
import {Command} from "../../../backend/core/command/command";
import {CommandExecutor} from "../../../backend/core/command/command-executor";
import {ArgumentError} from "common-errors";

chai.use(chaiAsPromised);

class DummyCommand extends Command {
    executionCount: number = 0;

    constructor(private throwError: boolean = false, private complete: boolean = true, readonly mandatoryArgs: Array<string> = []) {
        super();
    }

    get isExecuted(): boolean {
        return this.executionCount > 0;
    }

    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.executionCount++;
        if (this.throwError) {
            throw new Error('error');
        } else if (this.complete) {
            output.complete();
        } else {
            output.next({});
        }
    }
}

describe('CommandExecutor', function () {
    const args: any = {a: 'b', c: 15, d: false};
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
        const input: Observable<string> = from(['one', 'two']);
        executor.register(childCommandName, new DummyCommand(true));
        try {
            // when
            await executor.execute(childCommandName, args, input).toPromise();
            expect.fail('Command should fail with an error');
        } catch (e) {
            // then
            expect(e.message).equal(`Failed to ${childCommandName}. Reason: error.\nImplementation - ${childCommand.constructor.name}\nArguments: ${JSON.stringify(args)}\nInput is supplied`);
        }
    });
    it('should execute actual command since all the mandatory arguments are in place', async function () {
        // given
        const command: DummyCommand = new DummyCommand(false, true, Object.keys(args));
        executor.register(childCommandName, command);
        // when
        await executor.execute(childCommandName, args).toPromise();
        // then
        expect(command.isExecuted).true;
    });
    it('should throw an error since some of the mandatory arguments are missing', async function () {
        // given
        executor.register(childCommandName, new DummyCommand(false, true, Object.keys(args)));
        // then
        await expect(executor.execute(childCommandName, {}).toPromise()).rejectedWith(Error);
    });
    it('should throw an error if arguments were not specified but there are mandatory arguments', async function () {
        // given
        executor.register(childCommandName, new DummyCommand(false, true, Object.keys(args)));
        // then
        await expect(executor.execute(childCommandName).toPromise()).rejectedWith(Error);
    });
    it('should not throw an error if arguments were not specified since there are no mandatory arguments anyway', async function () {
        // given
        const command: DummyCommand = new DummyCommand();
        executor.register(childCommandName, command);
        // when
        await executor.execute(childCommandName).toPromise();
        // then
        expect(command.isExecuted).true;
    });
});
