import {Command} from "./command";
import {Process, ProcessStatus} from "./process";
import {EOL} from "os";
import {Observable} from "rxjs";

export class Execution {
    private status: ProcessStatus;
    private error: Error;
    private process: Process;
    readonly output: Array<string> = [];

    constructor(readonly startTime: number, private command: Command) {
    }

    attachTo(process: Process): void {
        this.process = process;
    }

    fail(error: Error): void {
        this.error = error;
        this.process = null;
    }

    complete(status: ProcessStatus): void {
        this.status = status;
        this.process = null;
    }

    get statusChanges(): Observable<ProcessStatus> {
        return this.process.status;
    }

    get commandName(): string {
        return this.command.name;
    }

    get commandScript(): string {
        return this.command.command;
    }

    get exitCode(): number {
        return this.status ? this.status.exitCode : null;
    }

    get exitSignal(): string {
        return this.status ? this.status.exitSignal : null;
    }

    get errorMessage(): string {
        return this.error ? this.error.message : null;
    }

    get outputAsString(): string {
        return this.output.join(EOL);
    }
}

export interface ExecutionRepository {
    add(execution: Execution): Promise<void>;
    remove(execution: Execution): Promise<void>;
}

export class ExecutionOperationError extends Error {
    constructor(operation: string, execution: Execution, cause: Error) {
        super(`Failed to ${operation} execution '${JSON.stringify(execution)}'. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, ExecutionOperationError.prototype);
    }
}
