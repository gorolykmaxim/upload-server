import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Log} from '../../log-watcher.service';

@Component({
  selector: 'app-log-list',
  templateUrl: './log-list.component.html'
})
export class LogListComponent {
  @Input() logs: Array<string> = [];
  @Output() deleteItem: EventEmitter<string> = new EventEmitter<string>();
  @Output() addItem: EventEmitter<string> = new EventEmitter<string>();

  getFileName(log: string): string {
    return Log.getFileName(log);
  }

  get canItemBeDeleted(): boolean {
    return this.deleteItem.observers.length > 0;
  }

  get canItemBeAdded(): boolean {
    return this.addItem.observers.length > 0;
  }
}
