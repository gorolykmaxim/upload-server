import getUuidByString = require("uuid-by-string");
import {Clock} from "clock";
import {Execution} from "./execution";
import {Process, ProcessFactory} from "./process";

export class Command {
    readonly id: string;

    constructor(readonly name: string, readonly command: string) {
        this.id = getUuidByString(name);
    }

    execute(clock: Clock, processFactory: ProcessFactory): Execution {
        const args: Array<string> = this.command.split(' ');
        const executable: string = args.splice(0, 1)[0];
        const process: Process = processFactory.create(executable, args);
        const execution: Execution = new Execution(clock.now(), this);
        execution.attachTo(process);
        process.outputs.subscribe(line => execution.appendToOutput(line));
        return execution;
    }
}

export interface CommandRepository {
    findAll(): Array<Command>;
    findById(id: string): Command;
    add(command: Command): void;
    remove(command: Command): void;
}
