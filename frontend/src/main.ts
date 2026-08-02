import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withViewTransitions } from '@angular/router';
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
  Plus,
  Pencil,
  Briefcase,
  X,
  Eye,
  GraduationCap,
  Star,
  Settings,
  Check,
  Mail,
  MessageCircle,
  Linkedin,
  Github,
  MapPin,
  File,
  Paperclip,
  FolderKanban,
} from 'lucide-angular';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withViewTransitions()),
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
        Plus,
        Pencil,
        Briefcase,
        X,
        Eye,
        GraduationCap,
        Star,
        Settings,
        Check,
        Mail,
        MessageCircle,
        Linkedin,
        Github,
        MapPin,
        File,
        Paperclip,
        FolderKanban,
      }),
    ),
  ],
}).catch((err) => console.error(err));
