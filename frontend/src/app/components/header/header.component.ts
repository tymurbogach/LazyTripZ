import { Component, DestroyRef, EventEmitter, HostListener, inject, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/response.interface';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isSidenavOpen = false;
  isMobile = false;
  isTablet = false;
  userData: User | null = null;

  @Output() SidenavOpened = new EventEmitter<Event>();

  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService
  ) {
    this.updateViewportSize();
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.authService.profile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.userData = response.data;
      },
      error: () => {}
    });
  }

  @HostListener('window:resize', [])
  updateViewportSize() {
    const width = window.innerWidth;
    this.isMobile = width < 425;
    this.isTablet = width <= 768;
    if (this.isMobile || this.isTablet) {
      this.isSidenavOpen = false;
    }
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  closeSidenav() {
    this.isSidenavOpen = false;
  }

  logout() {
    this.authService.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        if (response.success) {
          localStorage.removeItem('authToken');
          this.dialogService.success('Hasta la próxima!');
          this.router.navigate(['/auth/login']);
        } else {
          this.dialogService.error('Error al cerrar sesión');
        }
      },
      error: () => {
        this.dialogService.error('Error en la conexión con el servidor');
      }
    });
  }
}
