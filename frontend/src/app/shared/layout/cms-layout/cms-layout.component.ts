import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, RouterOutlet, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastService } from '../../ui/toast/toast.service';

// Layout parent semua halaman /admin-cms: validasi sesi sekali di sini, render sidebar + konten anak route.
@Component({
  selector: 'app-cms-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, LucideAngularModule],
  templateUrl: './cms-layout.component.html',
  styleUrl: './cms-layout.component.scss',
})
export class CmsLayoutComponent implements OnInit {
  user: CurrentUser | null = null;
  // Cuma relevan di layar sempit (<=880px, lihat sidebar-nya jadi drawer) — di desktop sidebar
  // selalu keliatan terlepas dari state ini (CSS di sidebar.component.scss yang nentuin).
  isSidebarOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  // Validasi token ke BE saat CMS dibuka, sekaligus ambil identitas user buat sidebar.
  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => (this.user = user),
      error: () => {
        this.auth.logout();
        this.toast.warning('Sesi kamu berakhir, silakan login lagi.');
        this.router.navigate(['/admin-cms/login']);
      },
    });

    // Tutup drawer mobile otomatis abis pindah halaman, biar user gak perlu nutup manual
    // tiap habis klik menu (klik menu item juga udah nutup lewat (closed), ini jaga-jaga
    // buat navigasi lain, ex: klik tombol back browser).
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isSidebarOpen = false;
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
