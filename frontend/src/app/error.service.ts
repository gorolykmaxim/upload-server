import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {SnackBarService} from './snack-bar.service';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ErrorService {
  errorSubject: Subject<Error> = new ReplaySubject();

  constructor(private snackbarService: SnackBarService) {
  }

  log(error: Error): void {
    this.snackbarService.showSnackBar(error instanceof HttpErrorResponse ? `${error.message}: ${error.error}` : error.message);
    this.errorSubject.next(error);
  }

  logAndReThrow(error: Error): void {
    this.log(error);
    throw error;
  }
}
