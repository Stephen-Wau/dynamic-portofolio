import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'admin-cms/login',
    loadComponent: () =>
      import('./features/admin-cms/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin-cms',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin-cms/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
];
