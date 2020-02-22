import {Injectable} from '@angular/core';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {SnackBarService} from './snack-bar.service';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ErrorService {
  private errorSubject: Subject<HistoricalError> = new ReplaySubject(200);

  constructor(private snackbarService: SnackBarService) {
  }

  log(error: Error): void {
    this.snackbarService.showSnackBar(error instanceof HttpErrorResponse ? `${error.message}: ${error.error}` : error.message);
    this.errorSubject.next(new HistoricalError(error));
  }

  logAndReThrow(error: Error): void {
    this.log(error);
    throw error;
  }

  watchErrors(): Observable<HistoricalError> {
    return this.errorSubject;
  }
}

export class HistoricalError {
  private readonly time: number;

  constructor(readonly error: Error) {
    this.time = Date.now();
  }

  get date(): Date {
    return new Date(this.time);
  }
  get message(): string {
    return this.error.message;
  }
}
