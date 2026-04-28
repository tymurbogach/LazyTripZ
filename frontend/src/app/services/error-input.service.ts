import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ErrorInputService {

  constructor() { }

  getErrorMessage(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);

    if (!control || !(control.touched || control.dirty)) return '';
    
    if (control?.errors) {
      if (control.errors['required']) {
        return ('Este campo es obligatorio')
      }
      if (control.errors['pattern']) {
        return ('El campo solo puede contener letras y espacios');
      }
      if (control.errors['minlength']) {
        return (`El campo debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`);
      }
      if (control.errors['email'] || control.errors['invalidEmail']) {
        return ('Formato de correo inválido');
      }
      if (control.errors['passwordMismatch']) {
        return ('Las contraseñas no coinciden');
      }
    }
    return '';
  }
}
