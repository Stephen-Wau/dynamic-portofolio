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
      import('./shared/layout/cms-layout/cms-layout.component').then((m) => m.CmsLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin-cms/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin-cms/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'work-histories',
        loadComponent: () =>
          import('./features/admin-cms/work-histories/work-histories.component').then(
            (m) => m.WorkHistoriesComponent,
          ),
      },
    ],
  },
];
