import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';
import { Response } from '../../interfaces/response.interface';

@Component({
  selector: 'app-auth',
  imports: [RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px)'}),
        animate('0.5s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)'}))
      ]),
    ])
  ]
})
export class AuthComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        localStorage.setItem('authToken', token);
        this.authService.profile().subscribe((response: Response<any>) => {
          if (response.success) {
            if (response.data.must_set_password) {
              this.changePassword();
            }
          }
        });
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  changePassword(): void {
    this.dialogService.changePassword().then((response: any) => {
      if (response.success && response.data) {
        this.authService.changePassword(response.data).subscribe({
          next: (response: Response<any>) => {
              if (response.success) {
                this.dialogService.success('Contraseña cambiada');
              }
          },
          error: (err) => {
            this.dialogService.error('Error al cambiar la contraseña');
          }
        });
      }
    });
  }
}

