import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {bufferTime} from 'rxjs/operators';

@Component({
  selector: 'app-append-only-list',
  templateUrl: './append-only-list.component.html'
})
export class AppendOnlyListComponent implements OnInit, OnDestroy {
  @Input() listObservable: Observable<string>;
  @Input() bufferIntervalMilliseconds = 500;
  serializedList = '';
  listSubscription: Subscription;

  ngOnInit(): void {
    this.listSubscription = this.listObservable.pipe(bufferTime(this.bufferIntervalMilliseconds)).subscribe(
      values => this.serializedList = [this.serializedList].concat(values).join('\n')
    );
  }

  ngOnDestroy(): void {
    this.listSubscription.unsubscribe();
    this.serializedList = null;
  }
}
