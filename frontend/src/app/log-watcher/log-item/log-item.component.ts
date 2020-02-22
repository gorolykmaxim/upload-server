import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-log-item',
  templateUrl: './log-item.component.html'
})
export class LogItemComponent {
  @Input() shortPath: string;
  @Input() path: string;
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();

  get canBeDeleted(): boolean {
    return this.delete.observers.length > 0;
  }

  deleteThisItem(e: Event): void {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.delete.emit();
  }
}
