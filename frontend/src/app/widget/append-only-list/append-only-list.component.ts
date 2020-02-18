import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {bufferTime, delay} from 'rxjs/operators';

@Component({
  selector: 'app-append-only-list',
  templateUrl: './append-only-list.component.html'
})
export class AppendOnlyListComponent implements AfterViewInit, OnDestroy {
  @Input() listObservable: Observable<string>;
  @Input() bufferIntervalMilliseconds = 500;
  @Input() autoScroll = false;
  @ViewChild('container') container: ElementRef;
  serializedList: string = null;
  listSubscription: Subscription;
  autoScrollSubscription: Subscription;

  ngAfterViewInit(): void {
    const bufferedObservable: Observable<Array<string>> = this.listObservable.pipe(bufferTime(this.bufferIntervalMilliseconds));
    this.listSubscription = bufferedObservable.subscribe(values => {
      this.serializedList = this.serializedList !== null ? [this.serializedList].concat(values).join('\n') : values.join('\n');
    });
    // DOM will not get re-rendered on this event loop iteration, so there is no reason to scroll to the bottom right away.
    // Scroll to the bottom with 1 ms delay, so that we will do it on the next iteration when the DOM will get updated.
    this.autoScrollSubscription = bufferedObservable.pipe(delay(1)).subscribe(_ => {
      if (this.autoScroll) {
        this.container.nativeElement.scroll({
          top: this.container.nativeElement.scrollHeight,
          left: 0,
          behavior: 'smooth'
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.listSubscription?.unsubscribe();
    this.autoScrollSubscription?.unsubscribe();
    this.serializedList = null;
  }
}
