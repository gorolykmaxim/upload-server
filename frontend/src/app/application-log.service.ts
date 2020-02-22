import {Injectable} from '@angular/core';
import {ErrorService} from './error.service';
import {ConfigService} from './config.service';
import {Log, LogWatcherService} from './log-watcher.service';

@Injectable({providedIn: 'root'})
export class ApplicationLogService {
  constructor(private logWatcherService: LogWatcherService, private configService: ConfigService, private errorService: ErrorService) { }

  async getLog(full: boolean): Promise<Log> {
    try {
      const config = await this.configService.getConfiguration();
      return await this.logWatcherService.getLog(config.logFile, full);
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }
}
