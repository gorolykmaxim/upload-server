import {AfterContentInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {Observable} from 'rxjs';
import * as prettyBytes from 'pretty-bytes';

@Component({
  selector: 'app-output-component',
  templateUrl: './output.component.html'
})
export class OutputComponent implements AfterContentInit {
  @Input() outputObservable: Observable<string>;
  @Input() name: string;
  @Input() size: number;
  @Input() autoScrollDown = false;
  @Output() loadFull: EventEmitter<any> = new EventEmitter<any>();
  isWaitingForFullOutput = false;

  ngAfterContentInit(): void {
    this.outputObservable.subscribe(() => this.isWaitingForFullOutput = false);
  }

  get canLoadFull(): boolean {
    return this.loadFull.observers.length > 0;
  }

  get formattedSize(): string {
    return prettyBytes(this.size);
  }

  requestFullLoad(): void {
    this.isWaitingForFullOutput = true;
    this.loadFull.emit(null);
  }
}
