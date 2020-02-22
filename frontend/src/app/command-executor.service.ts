import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorService} from './error.service';
import {Observable} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';
import {map, mergeAll, mergeMap, tap} from 'rxjs/operators';
import {getHost} from './url';

@Injectable({providedIn: 'root'})
export class CommandExecutorService {
  private static readonly BASE_HTTP_URL = '/api/command-executor';
  private static readonly BASE_WS_URL = `ws://${getHost()}`;
  private static readonly ALL_EVENTS_URL = `${CommandExecutorService.BASE_HTTP_URL}/event/status`;
  private static readonly BASE_COMMAND_URL = `${CommandExecutorService.BASE_HTTP_URL}/command`;
  private static readonly BASE_EXECUTION_URL = `${CommandExecutorService.BASE_HTTP_URL}/execution`;

  constructor(private httpClient: HttpClient, private errorService: ErrorService) {
  }

  async getAllCommands(): Promise<Array<Command>> {
    try {
      return await this.httpClient.get<Array<Command>>(CommandExecutorService.BASE_COMMAND_URL).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async addCommand(command: Command): Promise<void> {
    try {
      await this.httpClient.post(CommandExecutorService.BASE_COMMAND_URL, command).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async deleteCommand(command: Command): Promise<void> {
    try {
      await this.httpClient.delete(this.commandUrl(command)).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async execute(command: Command): Promise<void> {
    try {
      await this.httpClient.post(this.allExecutionsOfCommandUrl(command), null).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async getAllExecutions(): Promise<Array<Execution>> {
    try {
      const executions = await this.httpClient.get<Array<Execution>>(CommandExecutorService.BASE_EXECUTION_URL).toPromise();
      return executions.map(e => {
        return new Execution(e.startTime, e.commandId, e.commandName, e.commandScript, e.exitCode, e.exitSignal, e.errorMessage);
      });
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  watchAllExecutions(): Observable<Array<Execution>> {
    return webSocket(`${CommandExecutorService.BASE_WS_URL}${CommandExecutorService.ALL_EVENTS_URL}`).pipe(
      mergeMap(_ => this.getAllExecutions())
    );
  }

  async terminateExecution(execution: Execution): Promise<void> {
    try {
      await this.httpClient.post(this.executionUrl(execution, 'terminate'), null).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async haltExecution(execution: Execution): Promise<void> {
    try {
      await this.httpClient.post(this.executionUrl(execution, 'halt'), null).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async deleteExecution(execution: Execution): Promise<void> {
    try {
      await this.httpClient.delete(this.executionUrl(execution)).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async deleteAllExecutions(): Promise<void> {
    try {
      await this.httpClient.delete(CommandExecutorService.BASE_EXECUTION_URL).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async watchExecution(commandId: string, executionStartTime: number): Promise<ExecutionWithOutput> {
    try {
      const executions = await this.httpClient.get<Array<Execution>>(this.allExecutionsOfCommandUrl(commandId)).toPromise();
      const execution = executions.filter(e => e.startTime === executionStartTime)[0];
      if (!execution) {
        throw new Error(`Execution with ID '${executionStartTime}' does not exist`);
      }
      const outputUrl = `${CommandExecutorService.BASE_WS_URL}${this.executionUrl(execution, 'output')}?fromStart=true`;
      const output = webSocket<OutputChanges>(outputUrl).pipe(
        tap({error: e => this.errorService.log(e)}),
        map(c => c.changes),
        mergeAll()
      );
      return new ExecutionWithOutput(new Execution(execution.startTime, execution.commandId, execution.commandName), output);
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  private commandUrl(command: Command | string): string {
    return `${CommandExecutorService.BASE_COMMAND_URL}/${typeof command === 'string' ? command : command.id}`;
  }

  private allExecutionsOfCommandUrl(command: Command | string): string {
    return `${this.commandUrl(command)}/execution`;
  }

  private executionUrl(execution: Execution, action?: string): string {
    const urlParts: Array<string> = [
      CommandExecutorService.BASE_COMMAND_URL,
      execution.commandId,
      'execution',
      execution.startTime.toString()
    ];
    if (action) {
      urlParts.push(action);
    }
    return urlParts.join('/');
  }
}

export class Command {
  constructor(readonly id?: string, readonly name?: string, readonly script?: string) {
  }
}

export class Execution {
  constructor(readonly startTime: number = null, readonly commandId: string = null, readonly commandName: string = null,
              readonly commandScript: string = null, readonly exitCode: number = null, readonly exitSignal: string = null,
              readonly errorMessage: string = null) {
  }

  get startDate(): Date {
    return new Date(this.startTime);
  }

  get isSuccessful(): boolean {
    return this.exitCode === 0;
  }

  get isFailed(): boolean {
    return this.exitCode !== 0 && (this.exitCode !== null || this.exitSignal !== null || this.errorMessage !== null);
  }

  get isComplete(): boolean {
    return this.isSuccessful || this.isFailed;
  }
}

export class ExecutionWithOutput {
  constructor(private execution: Execution, readonly output: Observable<string>) {
  }

  get name(): string {
    return `${this.execution.commandName} ${this.execution.startDate.toLocaleString()}`;
  }
}

class OutputChanges {
  changes: Array<string>;
}
