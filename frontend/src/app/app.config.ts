import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog'; // Componente Dialog
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Animaciones en componentes
import { provideAnimations } from '@angular/platform-browser/animations'; // Animaciones en componentes
import { provideOAuthClient } from 'angular-oauth2-oidc'; // OAuth2
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Peticiones HTTP

import { authInterceptor } from './auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    { 
      provide: MAT_DIALOG_DEFAULT_OPTIONS, 
      useValue: { disableClose: true, hasBackdrop: true } 
    },
    provideAnimationsAsync(),
    provideAnimations(),
    provideOAuthClient(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
