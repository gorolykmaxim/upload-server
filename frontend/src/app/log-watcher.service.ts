import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {webSocket} from 'rxjs/webSocket';
import {map, mergeAll, tap} from 'rxjs/operators';
import {ErrorService} from './error.service';
import {SnackBarService} from './snack-bar.service';

@Injectable({providedIn: 'root'})
export class LogWatcherService {
  private static readonly BASE_URL = '/api/log-watcher/log';
  private static readonly BASE_WS_URL = `ws://${location.hostname}:8090${LogWatcherService.BASE_URL}`;

  constructor(private httpClient: HttpClient, private errorService: ErrorService, private snackbarService: SnackBarService) {
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
      return new Log(content, size.sizeInBytes, absolutePath);
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async getAllLogs(): Promise<Array<string>> {
    try {
      return await this.httpClient.get<Array<string>>(LogWatcherService.BASE_URL).toPromise();
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async addLog(absolutePath: string): Promise<void> {
    try {
      const result = await this.httpClient.post<LogAdditionInformation>(LogWatcherService.BASE_URL, {absolutePath}).toPromise();
      if (result.notice) {
        this.snackbarService.showSnackBar(result.notice);
      }
    } catch (e) {
      this.errorService.logAndReThrow(e);
    }
  }

  async deleteLog(absolutePath: string): Promise<void> {
    try {
      const query: HttpParams = new HttpParams().set('absolutePath', absolutePath);
      await this.httpClient.delete(LogWatcherService.BASE_URL, {params: query}).toPromise();
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
  constructor(readonly content: Observable<string>, readonly sizeInBytes: number, readonly path: string) {
  }

  static getFileName(path: string): string {
    const parts: Array<string> = path.split(new RegExp('/|\\\\'));
    return parts[parts.length - 1];
  }

  get fileName(): string {
    return Log.getFileName(this.path);
  }
}

export class LogAdditionInformation {
  notice?: string;
}
