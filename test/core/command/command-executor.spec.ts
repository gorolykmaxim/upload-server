import * as chai from "chai";
import {Observable, Subscriber} from "rxjs";
import {expect} from "chai";
import chaiAsPromised = require("chai-as-promised");
import {Command} from "../../../backend/core/command/command";
import {CommandExecutor} from "../../../backend/core/command/command-executor";

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
});