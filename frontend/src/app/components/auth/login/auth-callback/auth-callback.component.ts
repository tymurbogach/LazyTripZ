import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { SpinnerComponent } from '../../../utilities/spinner/spinner.component';

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
  ) {}

  ngOnInit() {
    // Leer token desde cookie (con withCredentials para enviar cookies)
    this.http.get<{ data: string }>('/api/auth/token-from-cookie', {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        if (response?.data) {
          localStorage.setItem('authToken', response.data);
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}