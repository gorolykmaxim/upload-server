import {CommandExecution, ExecutionStatus} from "../../../../../../app/command-executor/command/command-execution";
import {Collection} from "../../../../../../app/common/collection/collection";
import {Request, Response} from "express";
import {deepEqual, instance, mock, when} from "ts-mockito";
import {EOL} from "os";
import {Command} from "../../../../../../app/command-executor/command/command";
import {Events} from "../../../../../../app/common/events";

export class Mocks {
    readonly commandId: string = '12345';
    readonly startTime: number = 123456;
    readonly executionId: any = {commandId: this.commandId, startTime: this.startTime};
    readonly activeExecutionMock: CommandExecution;
    readonly completeExecutionMock: CommandExecution;
    readonly anotherExecution: CommandExecution;
    readonly secondAnotherExecution: CommandExecution;
    readonly activeExecution: CommandExecution;
    readonly completeExecution: CommandExecution;
    readonly activeExecutions: Collection<CommandExecution>;
    readonly completeExecutions: Collection<CommandExecution>;
    readonly execution: CommandExecution;
    readonly executionInstance: CommandExecution;
    readonly commands: Collection<Command>;
    readonly command: Command;
    readonly executionEvents: Events;

    readonly reqMock: Request;
    readonly resMock: Response;
    readonly req: Request;
    readonly res: Response;

    constructor() {
        this.activeExecutionMock = mock(CommandExecution);
        this.completeExecutionMock = mock(CommandExecution);
        this.anotherExecution = mock(CommandExecution);
        this.secondAnotherExecution = mock(CommandExecution);
        this.activeExecution = instance(this.activeExecutionMock);
        this.completeExecution = instance(this.completeExecutionMock);
        this.activeExecutions = mock<Collection<CommandExecution>>();
        this.completeExecutions = mock<Collection<CommandExecution>>();
        this.execution = mock(CommandExecution);
        this.executionInstance = instance(this.execution);
        this.commands = mock<Collection<Command>>();
        this.executionEvents = mock(Events);
        this.command = mock(Command);
        this.reqMock = mock<Request>();
        this.resMock = mock<Response>();
        this.req = instance(this.reqMock);
        this.res = instance(this.resMock);
        when(this.reqMock.params).thenReturn({commandId: this.commandId, startTime: this.startTime.toString()});
        when(this.activeExecutions.contains(deepEqual(this.executionId))).thenResolve(true);
        when(this.activeExecutions.findById(deepEqual(this.executionId))).thenResolve(this.executionInstance);
        when(this.activeExecutionMock.commandId).thenReturn(this.commandId);
        when(this.activeExecutionMock.startTime).thenReturn(2);
        when(this.activeExecutionMock.getStatus()).thenReturn(ExecutionStatus.executing);
        when(this.completeExecutionMock.commandId).thenReturn(this.commandId);
        when(this.completeExecutionMock.startTime).thenReturn(1);
        when(this.completeExecutionMock.getStatus()).thenReturn(ExecutionStatus.finished);
        when(this.anotherExecution.commandId).thenReturn('123');
        when(this.secondAnotherExecution.commandId).thenReturn('312');
        when(this.activeExecutions.findAll()).thenResolve([
            this.activeExecution, instance(this.anotherExecution)
        ]);
        when(this.completeExecutions.findAll()).thenResolve([
            this.completeExecution, instance(this.secondAnotherExecution)
        ]);
        when(this.execution.commandId).thenReturn(this.commandId);
        when(this.execution.startTime).thenReturn(this.startTime);
        when(this.execution.eol).thenReturn(EOL);
        when(this.execution.getStatus()).thenReturn(ExecutionStatus.executing);
        when(this.execution.getOutputAsString()).thenReturn(`line 1${EOL}line 2${EOL}`);
        when(this.execution.getOutputLines()).thenReturn(['line 1', 'line 2']);
        when(this.commands.findById(this.commandId)).thenResolve(instance(this.command));
        when(this.command.execute()).thenReturn(this.executionInstance);
    }
}