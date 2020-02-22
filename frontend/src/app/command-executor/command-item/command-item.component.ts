import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Command} from '../../command-executor.service';

@Component({
  selector: 'app-command-item',
  templateUrl: './command-item.component.html'
})
export class CommandItemComponent {
  @Input() command: Command;
  @Output() run = new EventEmitter();
  @Output() edit = new EventEmitter();
  @Output() delete = new EventEmitter();

  get canBeRemoved(): boolean {
    return this.delete.observers.length > 0;
  }

  get canBeEdited(): boolean {
    return this.edit.observers.length > 0;
  }
}
