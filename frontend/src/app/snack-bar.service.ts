import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({providedIn: 'root'})
export class SnackBarService {
  private static readonly TIME_PER_CHARACTER_COEFFICIENT = 45;
  private static readonly MIN_DURATION = 5000;

  constructor(private matSnackBar: MatSnackBar) {
  }

  showSnackBar(message: string): void {
    const duration = Math.max(SnackBarService.MIN_DURATION, message.length * SnackBarService.TIME_PER_CHARACTER_COEFFICIENT);
    this.matSnackBar.open(message, null, {duration});
  }
}
