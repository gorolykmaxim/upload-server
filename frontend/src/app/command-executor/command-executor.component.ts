import {Component, OnDestroy, OnInit} from '@angular/core';
import {Command, CommandExecutorService, Execution, ExecutionWithOutput} from '../command-executor.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {ConfigService} from '../config.service';
import {ConfirmationService} from '../confirmation.service';

@Component({
  selector: 'app-command-executor',
  templateUrl: './command-executor.component.html'
})
export class CommandExecutorComponent implements OnInit, OnDestroy {
  commands: Array<Command> = [];
  executions: Array<Execution> = [];
  isEditable = false;
  editing = false;
  paramsSubscription: Subscription;
  executionsSubscription: Subscription;
  selectedExecution: ExecutionWithOutput = null;

  constructor(private route: ActivatedRoute, private commandExecutorService: CommandExecutorService, private configService: ConfigService,
              private confirmationService: ConfirmationService) {
  }

  ngOnInit(): void {
    this.paramsSubscription = this.route.params.subscribe(async params => {
      if (params.commandId && params.executionStartTime) {
        this.selectedExecution = await this.commandExecutorService.watchExecution(
          params.commandId,
          parseInt(params.executionStartTime, 10)
        );
      } else {
        this.selectedExecution = null;
      }
    });
    this.executionsSubscription = this.commandExecutorService.watchAllExecutions().subscribe(es => this.executions = es);
    this.loadCommands();
    this.loadExecutions();
    this.loadConfiguration();
  }

  async loadCommands(): Promise<void> {
    this.commands = await this.commandExecutorService.getAllCommands();
  }

  async loadExecutions(): Promise<void> {
    this.executions = await this.commandExecutorService.getAllExecutions();
  }

  async loadConfiguration(): Promise<void> {
    const config = await this.configService.getConfiguration();
    this.isEditable = config.isInAdminMode;
  }

  async addCommand(command: Command): Promise<void> {
    this.editing = false;
    await this.commandExecutorService.addCommand(command);
    await this.loadCommands();
  }

  async deleteCommand(command: Command): Promise<void> {
    if (await this.confirmationService.requestConfirmation('Removal', `You are about to remove the command '${command.name}'.`)) {
      await this.commandExecutorService.deleteCommand(command);
      await this.loadCommands();
      await this.loadExecutions();
    }
  }

  async executeCommand(command: Command): Promise<void> {
    await this.commandExecutorService.execute(command);
    await this.loadExecutions();
  }

  async terminateExecution(execution: Execution): Promise<void> {
    await this.commandExecutorService.terminateExecution(execution);
  }

  async haltExecution(execution: Execution): Promise<void> {
    await this.commandExecutorService.haltExecution(execution);
  }

  async deleteExecution(execution: Execution): Promise<void> {
    await this.commandExecutorService.deleteExecution(execution);
    await this.loadExecutions();
  }

  async deleteAllExecutions(): Promise<void> {
    const message = `You are about to remove ALL executions! Complete executions will be removed from the history and all active executions
     will get aborted.`;
    if (await this.confirmationService.requestConfirmation('Global removal', message)) {
      await this.commandExecutorService.deleteAllExecutions();
      await this.loadExecutions();
    }
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
    this.executionsSubscription.unsubscribe();
  }
}
