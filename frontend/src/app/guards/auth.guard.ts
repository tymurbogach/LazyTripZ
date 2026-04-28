import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
}; 