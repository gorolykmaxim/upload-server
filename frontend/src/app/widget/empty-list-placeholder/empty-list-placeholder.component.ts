import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-empty-list-placeholder',
  templateUrl: './empty-list-placeholder.component.html'
})
export class EmptyListPlaceholderComponent {
  @Input() contentType: string;
}
