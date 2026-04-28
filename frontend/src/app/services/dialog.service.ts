import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from '../components/utilities/dialog/dialog.component';
import { firstValueFrom } from 'rxjs';

enum DialogIcon {
  INFO = '/Dialog/info.png',
  ERROR = '/Dialog/error.png',
  FATAL_ERROR = '/Dialog/fatalError.png',
  CONFIRM = '/Dialog/confirm.png',
  SUCCESS = '/Dialog/success.png'
}

export interface DialogOptions {
  title?: string;
  message: string;
  icon?: string;
  confirm?: boolean;
  setPassword?: boolean;
  customButtons?: {
    confirm?: string;
    cancel?: string;
  };
  width?: string;
  disableClose?: boolean;
  panelClass?: string | string[];
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private defaultConfig: MatDialogConfig = {
    width: '400px',
    disableClose: true,
    hasBackdrop: true,
    panelClass: 'rounded-2xl'
  };

  constructor(
    private dialog: MatDialog
  ) { }

  private openDialog(options: DialogOptions): Promise<any> {
    const dialogConfig = {
      ...this.defaultConfig,
      data: {
        title: options.title,
        message: options.message,
        icon: options.icon,
        confirm: options.confirm,
        setPassword: options.setPassword,
        customButtons: options.customButtons
      },
      width: options.width || this.defaultConfig.width,
      disableClose: options.disableClose !== undefined ? options.disableClose : this.defaultConfig.disableClose,
      panelClass: options.panelClass || this.defaultConfig.panelClass
    };

    const dialogRef = this.dialog.open(DialogComponent, dialogConfig);
    return firstValueFrom(dialogRef.afterClosed());
  }

  info(message: string, options: Partial<DialogOptions> = {}): Promise<any> {
    return this.openDialog({
      icon: DialogIcon.INFO,
      message,
      ...options
    });
  }

  async confirm(message: string, options: Partial<DialogOptions> = {}): Promise<boolean> {
    const result = await this.openDialog({
      icon: DialogIcon.CONFIRM,
      message,
      confirm: true,
      ...options
    });
    return result?.success || false;
  }

  success(message: string, options: Partial<DialogOptions> = {}): Promise<any> {
    return this.openDialog({
      icon: DialogIcon.SUCCESS,
      message,
      ...options
    });
  }

  error(message: string, options: Partial<DialogOptions> = {}): Promise<any> {
    return this.openDialog({
      icon: DialogIcon.ERROR,
      message,
      ...options
    });
  }

  fatalError(message: string, options: Partial<DialogOptions> = {}): Promise<any> {
    return this.openDialog({
      icon: DialogIcon.FATAL_ERROR,
      message,
      ...options
    });
  }

  async changePassword(options: Partial<DialogOptions> = {}): Promise<{ success: boolean; data?: string }> {
    return this.openDialog({
      icon: DialogIcon.INFO,
      message: 'Por seguridad, sustituye la contraseña por una nueva',
      setPassword: true,
      ...options
    });
  }

  // New method for custom dialogs
  custom(options: DialogOptions): Promise<any> {
    return this.openDialog(options);
  }
}
