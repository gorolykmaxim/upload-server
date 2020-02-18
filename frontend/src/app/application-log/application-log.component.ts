import {Component} from '@angular/core';
import {interval, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-application-log',
  templateUrl: './application-log.component.html'
})
export class ApplicationLogComponent {
  generatedList: Observable<string> = interval(50).pipe(map(v => `Item #${v}`));

  constructor() { }
}
