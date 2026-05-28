import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../../../services/auth.service';
import { DialogService } from '../../../../services/dialog.service';
import { SpinnerComponent } from '../../../utilities/spinner/spinner.component';
import { Response } from '../../../../interfaces/response.interface';

@Component({
  selector: 'app-auth-callback',
  imports: [SpinnerComponent],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private dialogService: DialogService,
  ) {}

  ngOnInit() {
    this.http.get<{ data: string }>('/api/auth/token-from-cookie', {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        if (response?.data) {
          localStorage.setItem('authToken', response.data);
          this.authService.profile().subscribe((userResp: Response<any>) => {
            if (userResp.success && userResp.data?.must_set_password) {
              this.dialogService.changePassword().then((res: any) => {
                if (res.success && res.data) {
                  this.authService.changePassword(res.data).subscribe();
                }
              });
            }
          });
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
