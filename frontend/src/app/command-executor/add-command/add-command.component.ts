import {Component, EventEmitter, Output} from '@angular/core';
import {Command} from '../../command-executor.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-add-command',
  templateUrl: './add-command.component.html'
})
export class AddCommandComponent {
  addCommandForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
    script: new FormControl('', [Validators.required, Validators.minLength(1)])
  });
  @Output() cancel = new EventEmitter();
  @Output() save = new EventEmitter<Command>();

  submit(): void {
    if (!this.addCommandForm.invalid) {
      this.save.emit(new Command(null, this.addCommandForm.get('name').value, this.addCommandForm.get('script').value));
    }
  }
}
