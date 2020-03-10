import {Component, OnDestroy, OnInit} from '@angular/core';
import {Log, LogWatcherService} from '../log-watcher.service';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {ConfigService} from '../config.service';
import {ConfirmationService} from '../confirmation.service';

@Component({
  selector: 'app-log-watcher',
  templateUrl: './log-watcher.component.html'
})
export class LogWatcherComponent implements OnInit, OnDestroy {
  isFullScreen = false;
  isEditable = false;
  log: Log = null;
  editing = false;
  logs: Array<string> = [];
  queryParamsSubscription: Subscription;

  constructor(private route: ActivatedRoute, private logWatcherService: LogWatcherService, private configService: ConfigService,
              private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(async params => {
      if (params.absolutePath) {
        await this.watchLog(params.absolutePath, false);
      } else {
        this.log = null;
      }
    });
    this.loadLogs();
    this.loadConfiguration();
  }

  async watchLog(absolutePath: string, full: boolean): Promise<void> {
    this.log = await this.logWatcherService.getLog(absolutePath, full);
  }

  async watchCurrentLog(full: boolean): Promise<void> {
    await this.watchLog(this.log.path, full);
  }

  async addLog(log: string): Promise<void> {
    this.editing = false;
    await this.logWatcherService.addLog(log);
    await this.loadLogs();
  }

  async deleteLog(log: string): Promise<void> {
    if (await this.confirmationService.requestConfirmation('Removal', `You are about to remove the log file '${log}' from the list.`)) {
      await this.logWatcherService.deleteLog(log);
      await this.loadLogs();
    }
  }

  async loadLogs(): Promise<void> {
    this.logs = await this.logWatcherService.getAllLogs();
  }

  async loadConfiguration(): Promise<void> {
    const config = await this.configService.getConfiguration();
    this.isEditable = config.isInAdminMode;
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription.unsubscribe();
  }
}
