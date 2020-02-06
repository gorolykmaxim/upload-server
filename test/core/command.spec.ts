import {Command, CommandExecutor} from "../../backend/core/command";
import {Observable, Subscriber} from "rxjs";
import * as chai from "chai";
import {expect} from "chai";
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

class DummyCommand extends Command {
    isExecuted: boolean = false;

    constructor(private throwError: boolean = false, private complete: boolean = true) {
        super();
    }

    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        this.isExecuted = true;
        if (this.throwError) {
            output.error('error');
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
    it('should catch error, happened in the child command and forward it to its output', async function () {
        // given
        executor.register(childCommandName, new DummyCommand(true));
        // when
        const output: Observable<any> = executor.execute(childCommandName);
        // then
        await expect(output.toPromise()).rejectedWith('error');
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
