import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Execution} from '../../command-executor.service';

@Component({
  selector: 'app-execution-list',
  templateUrl: './execution-list.component.html'
})
export class ExecutionListComponent {
  @Input() executions: Array<Execution>;
  @Output() terminate = new EventEmitter<Execution>();
  @Output() halt = new EventEmitter<Execution>();
  @Output() delete = new EventEmitter<Execution>();
}
