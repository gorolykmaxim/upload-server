import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Command} from '../../command-executor.service';

@Component({
  selector: 'app-command-list',
  templateUrl: './command-list.component.html'
})
export class CommandListComponent {
  @Input() commands: Array<Command>;
  @Output() run = new EventEmitter<Command>();
  @Output() edit = new EventEmitter<Command>();
  @Output() delete = new EventEmitter<Command>();
  @Output() add = new EventEmitter();

  get canItemBeModified(): boolean {
    return this.delete.observers.length > 0 && this.edit.observers.length > 0;
  }

  get canItemBeAdded(): boolean {
    return this.add.observers.length > 0;
  }
}
