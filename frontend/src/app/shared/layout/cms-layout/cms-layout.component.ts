import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastService } from '../../ui/toast/toast.service';

// Layout parent semua halaman /admin-cms: validasi sesi sekali di sini, render sidebar + konten anak route.
@Component({
  selector: 'app-cms-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './cms-layout.component.html',
  styleUrl: './cms-layout.component.scss',
})
export class CmsLayoutComponent implements OnInit {
  user: CurrentUser | null = null;

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
  }
}
