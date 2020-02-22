import {Component, OnInit} from '@angular/core';
import {ErrorService} from '../error.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-error-log',
  templateUrl: './error-log.component.html'
})
export class ErrorLogComponent implements OnInit {
  errorObservable: Observable<string>;

  constructor(private errorService: ErrorService) {
  }

  ngOnInit(): void {
    this.watchErrors();
  }

  async watchErrors(): Promise<void> {
    this.errorObservable = this.errorService.watchErrors().pipe(map(e => `${e.date.toLocaleString()} ${e.message}`));
  }
}
