import {Observable} from "rxjs";

export interface ProcessStatus {
    exitCode?: number,
    exitSignal?: string
}

export interface Process {
    readonly status: Observable<ProcessStatus>;
    readonly outputs: Observable<string>;
    sendSignal(signal: number): void;
}

export interface ProcessFactory {
    create(command: string, args: Array<string>): Process;
}
