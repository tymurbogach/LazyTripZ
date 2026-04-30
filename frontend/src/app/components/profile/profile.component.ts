import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User, Response } from '../../interfaces/response.interface';
import { SpinnerComponent } from "../utilities/spinner/spinner.component";

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SpinnerComponent, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  userProfile: User | undefined;
  isSidenavOpen = false;
  isLoading = false;
  isUploading = false;
  uploadError: string | null = null;
  showInitials = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.getProfile();
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  closeSidenav() {
    this.isSidenavOpen = false;
  }

  getProfile(): void {
    this.isLoading = true;
    this.authService.profile().subscribe({
      next: (response: Response<User>) => {
        if (response.success) {
          this.userProfile = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getUserInitials(): string {
    if (this.userProfile?.name) {
      return this.userProfile.name
        .split(' ')
        .map((n: string) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return this.userProfile?.email?.charAt(0).toUpperCase() || 'U';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Por favor selecciona una imagen válida';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'La imagen no debe superar los 5MB';
        return;
      }

      this.uploadError = null;
      this.isUploading = true;

      this.authService.updateAvatar(file).subscribe({
        next: (response) => {
          if (response.success) {
            this.userProfile = response.data;
          }
        },
        error: (error) => {
          console.error('Error uploading avatar:', error);
          this.uploadError = 'Error al subir la imagen. Por favor intenta de nuevo.';
        },
        complete: () => {
          this.isUploading = false;
        }
      });
    }
  }

  handleImageError() {
    this.showInitials = true;
  }
}
