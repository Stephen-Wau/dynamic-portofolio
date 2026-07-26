import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, CurrentUser } from '../../../core/auth/auth.service';

// Placeholder halaman CMS setelah login, route /admin-cms (dilindungi authGuard).
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  user: CurrentUser | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  // Validasi token ke BE saat halaman dibuka, sekaligus ambil identitas user.
  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => (this.user = user),
      error: () => this.logout(),
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin-cms/login']);
  }
}
