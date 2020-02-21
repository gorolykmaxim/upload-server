import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {webSocket} from 'rxjs/webSocket';
import {map, mergeAll, tap} from 'rxjs/operators';
import {ErrorService} from './error.service';

@Injectable({providedIn: 'root'})
export class LogWatcherService {
  private static readonly BASE_URL = '/api/log-watcher/log';
  private static readonly BASE_WS_URL = `ws://${location.hostname}:8090${LogWatcherService.BASE_URL}`;

  constructor(private httpClient: HttpClient, private errorService: ErrorService) {
  }

  async getLog(absolutePath: string, full: boolean = false): Promise<Log> {
    try {
      const query = new HttpParams().set('absolutePath', absolutePath);
      const size = await this.httpClient.get<LogSize>(`${LogWatcherService.BASE_URL}/size`, {params: query}).toPromise();
      const content = webSocket<LogChange>(`${LogWatcherService.BASE_WS_URL}?absolutePath=${absolutePath}&fromStart=${full}`)
        .pipe(
          tap({error: error => this.errorService.log(error)}),
          map(c => c.changes),
          mergeAll()
        );
      return new Log(content, size.sizeInBytes);
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }
}

class LogChange {
  changes: Array<string>;
}

class LogSize {
  sizeInBytes: number;
}

export class Log {
  constructor(readonly content: Observable<string>, readonly sizeInBytes: number) {
  }
}
