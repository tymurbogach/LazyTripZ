import { Component, OnInit } from '@angular/core';
import { FormsModule, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations'; 

import { InputType } from '../../../enum/input.enum';
import { AuthService } from '../../../services/auth.service';
import { DialogService } from '../../../services/dialog.service';
import { InputComponent } from '../../utilities/input/input.component';
import { BtnGoogleComponent } from './btn-google/btn-google.component';
import { SpinnerComponent } from '../../utilities/spinner/spinner.component';
import { Response } from '../../../interfaces/response.interface';

@Component({
  selector: 'app-login',
  imports: [RouterModule, FormsModule, ReactiveFormsModule, BtnGoogleComponent, InputComponent, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.5s ease-in-out', style({ opacity: 0 }))
      ]),
    ])
  ]
})
export class LoginComponent implements OnInit {
  public isLoading: boolean = false;
  public InputType = InputType;
  public user: string = '';
  public password: string = '';
  public form: FormGroup = new FormGroup({
    username: new FormControl('', [ Validators.required ]),
    password: new FormControl('', [ Validators.required ])
  });
  public usernameControl = this.form.get('username') as FormControl;
  public passwordControl = this.form.get('password') as FormControl;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.user = '';
    this.password = '';
    this.isLoading = false;
  }

  public login(): void {
    if (this.form.valid) {
      this.isLoading = true;

      this.authService.login(this.form.value).subscribe({
        next: (response: Response<any>) => {
          this.isLoading = false;

          if (response.success) {
            localStorage.setItem('authToken', response.data);
            this.dialogService.success('Sesión iniciada');
            this.router.navigate(['/dashboard']);

          } else {
            this.dialogService.error(response.message);
          }
        },
        error: (err) => {
          this.isLoading = false;

          if (err.status === 401) {
            this.dialogService.error('Usuario o contraseña incorrecto');

          } else {
            this.dialogService.fatalError('Error en la conexión con el servidor');
          }
        }
      });

    } else {
      this.dialogService.info('Datos incompletos');
    }
  }
}
