import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  // Kontrol drawer di mobile (<=880px, lihat sidebar.component.scss) — di desktop diabaikan
  // karena sidebar-nya emang selalu keliatan (position: static).
  @Input() isOpen = false;
  // Di-emit tiap kali sidebar mestinya ditutup dari dalam (klik menu item, atau logout),
  // parent (CmsLayoutComponent) yang pegang source-of-truth isOpen-nya.
  @Output() closed = new EventEmitter<void>();

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

  // Hapus token & lempar balik ke halaman login, dipanggil dari tombol Logout.
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin-cms/login']);
  }

  // Dipanggil pas klik menu item — di mobile, drawer harus nutup otomatis abis pindah halaman.
  // Di desktop ini gak ngefek apa-apa (isOpen diabaikan lewat CSS), jadi aman dipanggil selalu.
  onMenuItemClick(): void {
    this.closed.emit();
  }
}
