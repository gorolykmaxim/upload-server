import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Command} from '../../command-executor.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-add-or-edit-command',
  templateUrl: './add-or-edit-command.component.html'
})
export class AddOrEditCommandComponent implements OnInit {
  addCommandForm: FormGroup;
  @Input() command: Command = null;
  @Output() cancel = new EventEmitter();
  @Output() save = new EventEmitter<Command>();

  ngOnInit(): void {
    this.addCommandForm = new FormGroup({
      name: new FormControl(this.command?.name || '', [Validators.required, Validators.minLength(1)]),
      script: new FormControl(this.command?.script || '', [Validators.required, Validators.minLength(1)])
    });
  }

  submit(): void {
    if (!this.addCommandForm.invalid) {
      this.save.emit(new Command(null, this.addCommandForm.get('name').value, this.addCommandForm.get('script').value));
    }
  }

  get isInEditMode(): boolean {
    return this.command !== null;
  }
}
