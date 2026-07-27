import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { ButtonComponent } from '../../ui/button/button.component';
import { CMS_MENU_ITEMS } from '../cms-menu.config';

// Sidebar kiri CMS: section profile+logout di atas, section menu navigasi di bawah.
// Icon (LayoutDashboard, User, LogOut) didaftarkan sekali di main.ts via LucideAngularModule.pick().
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() user: CurrentUser | null = null;

  menuItems = CMS_MENU_ITEMS;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin-cms/login']);
  }
}
