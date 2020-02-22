import {Component, EventEmitter, Output} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-add-log',
  templateUrl: './add-log.component.html'
})
export class AddLogComponent {
  addLogForm = new FormGroup({
    absolutePath: new FormControl('', [Validators.required, Validators.minLength(1)])
  });
  @Output() cancel = new EventEmitter();
  @Output() save = new EventEmitter<string>();

  submit(): void {
    if (!this.addLogForm.invalid) {
      this.save.emit(this.addLogForm.get('absolutePath').value);
    }
  }
}
