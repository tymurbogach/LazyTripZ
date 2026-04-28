import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthCallbackComponent } from './components/auth/login/auth-callback/auth-callback.component';
import { MoreDetailsWeatherTripComponent } from './components/dashboard/trip/details-weather-trip/more-details-weather-trip/more-details-weather-trip.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: "auth",
        component: AuthComponent,
        children: [
            {
                path: "login",
                component: LoginComponent
            },
            {
                path: "registro",
                component: RegisterComponent
            },
            {
                path: "callback",
                component: AuthCallbackComponent
            },
            {
                path: "",
                redirectTo: "login",
                pathMatch: "full"
            },
            {
                path: "**",
                redirectTo: "login"
            }
        ]
    },
    {
        path: "dashboard",
        component: DashboardComponent,
        canActivate: [authGuard]
    },
    {
        path: "profile",
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        // Esto lo que hace es que lo carge solo cuando se acceda a la ruta, para mejorar el rendimiento (lazy loading)
        path: 'new-trip',
        loadComponent: () => import('./components/new-trip/new-trip.component').then(m => m.NewTripComponent),
        canActivate: [authGuard]
    },
    {
        path: "details_weather_trip/:tripId/:location",
        component: MoreDetailsWeatherTripComponent,
        canActivate: [authGuard]
    },
    {
        path: "recommendations",
        component: RecommendationsComponent,
        canActivate: [authGuard]
    },
    {
        path: "recommendations/:tripId/:tripName",
        component: RecommendationsComponent,
        canActivate: [authGuard]
    },
    {
        path: "diaries",
        loadComponent: () => import('./components/diaries/diaries.component').then(m => m.DiariesComponent),
        canActivate: [authGuard]
    },
    {
        path: "**",
        redirectTo: "auth/login"
    }
];