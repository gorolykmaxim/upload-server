import {Command} from "../command/command";
import {Observable, Subscriber} from "rxjs";
import {CREATE_PROCESS, CreateChildProcess, CreateProcess} from "./create-process";
import {Dictionary} from "typescript-collections";
import {CommandExecutor} from "../command/command-executor";
import {CommandWithArguments} from "../command/command-with-arguments";
import {SEND_SIGNAL_TO_PROCESS, SendSignalToProcess} from "./send-signal-to-process";
import {WATCH_PROCESS_OUTPUT, WatchProcessOutput} from "./watch-process-output";
import {Process} from "./base";
import {WATCH_PROCESS_STATUS, WatchProcessStatus} from "./watch-process-status";

export const INITIALIZE_PROCESSING: string = 'initialize processing';

/**
 * Initialize processing sub-system.
 */
export class InitializeProcessing extends Command {
    /**
     * Construct a command.
     *
     * @param commandExecutor command executor to register processing-related commands in
     * @param createChildProcess factory method to create the actual process
     * @param eol end-of-line separator of STDOUT and STDERR of processes
     */
    constructor(private commandExecutor: CommandExecutor, private createChildProcess: CreateChildProcess,
                private eol: string) {
        super();
    }

    /**
     * {@inheritDoc}
     */
    async execute(output: Subscriber<any>, args?: any, input?: Observable<any>): Promise<void> {
        const pidToProcess: Dictionary<number, Process> = new Dictionary<number, Process>();
        this.commandExecutor.register(CREATE_PROCESS, new CommandWithArguments(new CreateProcess(this.createChildProcess, pidToProcess)));
        this.commandExecutor.register(SEND_SIGNAL_TO_PROCESS, new CommandWithArguments(new SendSignalToProcess(pidToProcess)));
        this.commandExecutor.register(WATCH_PROCESS_OUTPUT, new CommandWithArguments(new WatchProcessOutput(pidToProcess, this.eol)));
        this.commandExecutor.register(WATCH_PROCESS_STATUS, new CommandWithArguments(new WatchProcessStatus(pidToProcess)));
        output.complete();
    }
}
