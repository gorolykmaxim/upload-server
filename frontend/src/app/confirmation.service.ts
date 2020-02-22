import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent, DialogData} from './widget/confirmation-dialog/confirmation-dialog.component';

@Injectable({providedIn: 'root'})
export class ConfirmationService {
  constructor(private dialog: MatDialog) {
  }

  async requestConfirmation(operation: string, message: string): Promise<boolean> {
    return await this.dialog.open<ConfirmationDialogComponent, DialogData, boolean>(
      ConfirmationDialogComponent,
      {
        width: '500px',
        data: {operation, message}
      }
    ).afterClosed().toPromise();
  }
}
