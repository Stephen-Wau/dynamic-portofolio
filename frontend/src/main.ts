import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  Save,
  ImagePlus,
  RefreshCw,
  Trash2,
} from 'lucide-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard,
        User,
        LogOut,
        LogIn,
        Save,
        ImagePlus,
        RefreshCw,
        Trash2,
      }),
    ),
  ],
}).catch((err) => console.error(err));
