import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Execution} from '../../command-executor.service';

@Component({
  selector: 'app-execution-item',
  templateUrl: './execution-item.component.html'
})
export class ExecutionItemComponent {
  @Input() execution: Execution;
  @Output() delete = new EventEmitter();
  @Output() terminate = new EventEmitter();
  @Output() halt = new EventEmitter();

  getUrlOf(execution: Execution): string {
    return `/command/${execution.commandId}/execution/${execution.startTime}`;
  }

  getResultInfo(execution: Execution): string {
    if (execution.isComplete) {
      const infoParts = [];
      if (execution.exitCode !== null) {
        infoParts.push(`exit code - ${execution.exitCode}`);
      }
      if (execution.exitSignal !== null) {
        infoParts.push(`exit signal - ${execution.exitSignal}`);
      }
      if (execution.errorMessage !== null) {
        infoParts.push(`error message - ${execution.errorMessage}`);
      }
      return infoParts.join(', ');
    } else {
      return 'running...';
    }
  }
}
