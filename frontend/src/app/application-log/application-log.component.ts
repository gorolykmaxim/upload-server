import {Component, OnInit} from '@angular/core';
import {Log} from '../log-watcher.service';
import {ApplicationLogService} from '../application-log.service';
import {EMPTY} from 'rxjs';

@Component({
  selector: 'app-application-log',
  templateUrl: './application-log.component.html',
})
export class ApplicationLogComponent implements OnInit {
  log: Log = new Log(EMPTY, 0, null);

  constructor(private applicationLogService: ApplicationLogService) { }

  ngOnInit(): void {
    this.watchLog(false);
  }

  async watchLog(full: boolean): Promise<void> {
    this.log = await this.applicationLogService.getLog(full);
  }
}
