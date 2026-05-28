import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../../services/auth.service';
import { SpinnerComponent } from '../../../utilities/spinner/spinner.component';

@Component({
  selector: 'app-btn-google',
  imports: [SpinnerComponent],
  templateUrl: './btn-google.component.html',
  styleUrl: './btn-google.component.css'
})
export class BtnGoogleComponent implements OnInit {
  public isLoading: boolean = false;

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = false;
  }

  public login(): void {
    this.isLoading = true;
    this.authService.loginGoogle();
  }
}
