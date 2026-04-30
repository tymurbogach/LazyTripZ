import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog',
  imports: [FormsModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent {
  password: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { icon: string; message: string; confirm?: boolean; setPassword?: boolean },
  ) {}

  onConfirm(): void {
    this.dialogRef.close({ 
      success: true, 
      data: this.password ? this.password : null
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false
    });
  }
}
