import {Command} from "./command";
import {Process, ProcessStatus} from "./process";
import {EOL} from "os";

export class Execution {
    private process: Process;

    constructor(readonly startTime: number, private command: Command, private status?: ProcessStatus,
                private error?: Error, private output?: Output) {
        if (!this.output) {
            this.output = new Output();
        }
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

    appendToOutput(line: string): void {
        this.output.append(line);
    }

    sendSignal(signal: number): void {
        this.process.sendSignal(signal);
    }

    get commandId(): string {
        return this.command.id;
    }

    get commandName(): string {
        return this.command.name;
    }

    get commandScript(): string {
        return this.command.script;
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
        return this.output.asString;
    }

    get outputLines(): Array<string> {
        return this.output.lines;
    }

    get isComplete(): boolean {
        return this.exitCode !== null || this.exitSignal !== null || this.errorMessage !== null;
    }
}

export class Output {
    private output: Array<string>;

    constructor(output?: Array<string> | string) {
        if (typeof output === 'string') {
            this.output = output.split(EOL);
        } else if (output instanceof Array) {
            this.output = output;
        } else {
            this.output = [];
        }
    }

    append(line: string): void {
        this.output.push(line);
    }

    get lines(): Array<string> {
        return this.output;
    }

    get asString(): string {
        return this.output.join(EOL);
    }
}

export interface ExecutionRepository {
    add(execution: Execution): Promise<void>;
    findAll(): Promise<Array<Execution>>;
    findByCommandName(commandName: string): Promise<Array<Execution>>;
    findByCommandNameAndStartTime(commandName: string, startTime: number): Promise<Execution>;
    remove(execution: Execution): Promise<void>;
}

export class ExecutionOperationError extends Error {
    constructor(operation: string, execution: Execution, cause: Error) {
        super(`Failed to ${operation} execution '${JSON.stringify(execution)}'. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, ExecutionOperationError.prototype);
    }
}

export class ExecutionsLookupError extends Error {
    constructor(query: string, cause: Error) {
        super(`Failed to find executions that ${query}. Reason: ${cause.message}`);
        Object.setPrototypeOf(this, ExecutionsLookupError.prototype);
    }
}
