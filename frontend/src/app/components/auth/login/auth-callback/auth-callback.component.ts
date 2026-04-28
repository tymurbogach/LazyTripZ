import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SpinnerComponent } from '../../../utilities/spinner/spinner.component';

@Component({
  selector: 'app-auth-callback',
  imports: [SpinnerComponent],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        localStorage.setItem('authToken', token);
        this.router.navigate(['/dashboard']);

      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
