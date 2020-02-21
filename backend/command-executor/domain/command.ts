import getUuidByString = require("uuid-by-string");
import {Clock} from "clock";
import {Execution} from "./execution";
import {Process, ProcessFactory} from "./process";
import {Subject} from "rxjs";
import {OutputChangeEvent, StatusChangeEvent} from "./events";

export class Command {
    readonly id: string;

    constructor(readonly name: string, readonly script: string) {
        this.id = getUuidByString(name);
    }

    execute(clock: Clock, processFactory: ProcessFactory, outputChanges: Subject<OutputChangeEvent>,
            statusChanges: Subject<StatusChangeEvent>): Execution {
        const process: Process = processFactory.create(this.script);
        const execution: Execution = new Execution(clock.now(), this);
        execution.attachTo(process);
        process.outputs.subscribe(line => {
            execution.appendToOutput(line);
            outputChanges.next(new OutputChangeEvent(execution, [line]));
        });
        process.status.subscribe(
            status => statusChanges.next(new StatusChangeEvent(execution, status)),
            error => statusChanges.next(new StatusChangeEvent(execution, null, error))
        );
        return execution;
    }
}

export interface CommandRepository {
    findAll(): Array<Command>;
    findById(id: string): Command;
    add(command: Command): void;
    remove(command: Command): void;
}
