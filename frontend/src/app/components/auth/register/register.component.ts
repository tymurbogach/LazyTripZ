import { Component, OnInit } from '@angular/core';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { InputType } from '../../../enum/input.enum';
import { AuthService } from '../../../services/auth.service';
import { DialogService } from '../../../services/dialog.service';
import { ErrorInputService } from '../../../services/error-input.service';
import { InputComponent } from '../../utilities/input/input.component';
import { SpinnerComponent } from '../../utilities/spinner/spinner.component';
import { Response } from '../../../interfaces/response.interface';

@Component({
  selector: 'app-register',
  imports: [ RouterModule, FormsModule, ReactiveFormsModule, InputComponent, SpinnerComponent ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 }))]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.5s ease-in-out', style({ opacity: 0 }))]),
    ])
  ]
})
export class RegisterComponent implements OnInit {
  public isLoading: boolean = false;
  public InputType = InputType;
  public name: string = '';
  public username: string = '';
  public email: string = '';
  public password: string = '';
  public confirmPassword: string = '';
  public errorMessages: { [key: string]: string } = {};
  public usernameValid: boolean = false;
  public emailValid: boolean = false;
  public form: FormGroup = new FormGroup({
    name: new FormControl('', 
      [ Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/), Validators.minLength(3) ]),
    username: new FormControl('', 
      [ Validators.required, Validators.minLength(3) ]),
    email: new FormControl('', 
      [ Validators.required, Validators.email, this.validateEmail.bind(this) ]),
    password: new FormControl('', 
      [ Validators.required, Validators.minLength(4) ]),
    confirmPassword: new FormControl('', 
      [ Validators.required, this.matchPassword.bind(this) ])
  });
  public nameControl = this.form.get('name') as FormControl;
  public usernameControl = this.form.get('username') as FormControl;
  public emailControl = this.form.get('email') as FormControl;
  public passwordControl = this.form.get('password') as FormControl;
  public confirmPasswordControl = this.form.get('confirmPassword') as FormControl;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService,
    private errorInputService: ErrorInputService
  ) {}

  ngOnInit(): void {
    this.name = '';
    this.username = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.usernameValid = false;
    this.emailValid = false;
    this.isLoading = false;
  }

  public onCheckUsername(valid: boolean): void {
    if (valid) {
      this.usernameValid = true;
    } else {
      this.usernameValid = false;
    }
  }

  public onCheckEmail(valid: boolean): void {
    if (valid) {
      this.emailValid = true;
    } else {
      this.emailValid = false;
    }
  }

  public validateEmail(control: AbstractControl): { [err: string]: boolean } | null {
    if (!this.form) return null;

    const email = control.value;
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!pattern.test(email)) return { invalidEmail: true };
    return null;
  }

  public matchPassword(control: AbstractControl): { [err: string]: boolean } | null {
    if (!this.form) return null;

    const password = this.form.get('password')?.value;
    const confirmPassword = control.value;

    if (password !== confirmPassword) return { passwordMismatch: true };
    return null;
  }

  public onInputFocus(campo: string): void {
    this.errorMessages[campo] = '';
  }

  public async register(): Promise<void> {
    const confirm = await this.dialogService.confirm('¿Confirmas los datos?');

    if (!confirm) return;
    
    if (this.form.valid && this.usernameValid && this.emailValid) {
      this.isLoading = true;

      this.authService.register(this.form.value).subscribe({
        next: (response: Response<any>) => {
          this.isLoading = false;

          if (response.success) {
            this.dialogService.success('Registro completado');
            this.router.navigate(['/auth/login']);

          } else {
            this.dialogService.error(response.message);
          }
        },
        error: (response: any) => {
          this.isLoading = false;
          this.dialogService.fatalError('Error con la base de datos: ' + response.error.message);
        }
      });

    } else {
      this.dialogService.info('Revisa los campos por favor');
      this.form.markAllAsTouched();

      Object.keys(this.form.controls).forEach(campo => {
        this.errorMessages[campo] = this.errorInputService.getErrorMessage(this.form, campo);
      });
    }
  }
}
