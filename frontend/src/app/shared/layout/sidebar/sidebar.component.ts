import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { ProfileService } from '../../../core/profile/profile.service';
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
export class SidebarComponent implements OnInit {
  @Input() user: CurrentUser | null = null;

  menuItems = CMS_MENU_ITEMS;

  constructor(
    private auth: AuthService,
    private router: Router,
    public profileService: ProfileService,
  ) {}

  // Ambil foto profil buat avatar; kalau gagal/belum ada, tetap fallback ke huruf pertama username.
  ngOnInit(): void {
    this.profileService.get().subscribe({ error: () => {} });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin-cms/login']);
  }
}
