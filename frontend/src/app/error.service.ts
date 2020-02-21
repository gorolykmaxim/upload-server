import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({providedIn: 'root'})
export class ErrorService {
  errorSubject: Subject<Error> = new ReplaySubject();

  constructor(private snackBar: MatSnackBar) {
  }

  log(error: Error): void {
    this.snackBar.open(error.message, null, {duration: 5000});
    this.errorSubject.next(error);
  }

  logAndReThrow(error: Error): void {
    this.log(error);
    throw error;
  }
}
