import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Lindungi route /admin-cms: redirect ke login kalau token tidak ada/expired.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasValidToken()) return true;

  return router.createUrlTree(['/admin-cms/login']);
};
