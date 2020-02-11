import * as chai from "chai";
import {expect} from "chai";
import {from, Observable, Subscriber} from "rxjs";
import {Command} from "../../../backend/core/command/command";
import {CommandExecutor} from "../../../backend/core/command/command-executor";
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
            throw new Error('error');
        } else if (this.complete) {
            output.complete();
        } else {
            output.next({});
        }
    }
}

class DummyCommandArgs {}

class DummyCommandWithArgs extends DummyCommand {
    readonly argsType: any = DummyCommandArgs;
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
    it('should throw an error while trying to invoke command with arguments of incorrect type', async function () {
        // given
        const command: Command = new DummyCommandWithArgs();
        executor.register(childCommandName, command);
        //then
        await expect(executor.execute(childCommandName, {}).toPromise()).rejectedWith(Error);
    });
    it('should throw an error while trying to invoke command without arguments', async function () {
        // given
        const command: Command = new DummyCommandWithArgs();
        executor.register(childCommandName, command);
        // then
        await expect(executor.execute(childCommandName).toPromise()).rejectedWith(Error);
    });
    it('should not throw an error while trying to invoke command with correct arguments', async function () {
        // given
        const command: DummyCommand = new DummyCommandWithArgs();
        executor.register(childCommandName, command);
        // when
        await executor.execute(childCommandName, new DummyCommandArgs()).toPromise();
        // then
        expect(command.isExecuted).true;
    });
    it('should not throw an error while trying to invoke command that does not expect any arguments', async function () {
        // given
        const command: DummyCommand = new DummyCommand();
        executor.register(childCommandName, command);
        // when
        await executor.execute(childCommandName).toPromise();
        // then
        expect(command.isExecuted).true;
    });
});
