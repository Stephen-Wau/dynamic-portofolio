import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { SettingsService, SettingsUser } from './settings.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Halaman Settings CMS, route /admin-cms/settings. Untuk sekarang cuma berisi 1 pengaturan:
// pilih user mana yang datanya ditampilkan di landing page publik (card per user, klik buat pilih).
// Ke depan bisa nambah pengaturan lain di halaman yang sama.
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  users: SettingsUser[] = [];
  featuredUserId: number | null = null;
  isLoading = true;
  // Simpan id yang lagi diproses biar tombol itu doang yang nunjukin loading, bukan semua card.
  savingUserId: number | null = null;

  constructor(
    private settingsService: SettingsService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      users: this.settingsService.listUsers(),
      featured: this.settingsService.getFeaturedUser(),
    }).subscribe({
      next: ({ users, featured }) => {
        this.users = users;
        this.featuredUserId = featured.user_id;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Gagal memuat data settings.');
      },
    });
  }

  // Huruf pertama username buat avatar fallback kalau user belum punya foto profil.
  initial(user: SettingsUser): string {
    return (user.full_name || user.username || '?').charAt(0).toUpperCase();
  }

  selectUser(user: SettingsUser): void {
    if (user.id === this.featuredUserId || this.savingUserId) return;

    this.savingUserId = user.id;
    this.settingsService.setFeaturedUser(user.id).subscribe({
      next: () => {
        this.savingUserId = null;
        this.featuredUserId = user.id;
        this.toast.success(`${user.full_name || user.username} sekarang ditampilkan di landing page.`);
      },
      error: () => {
        this.savingUserId = null;
        this.toast.error('Gagal menyimpan pilihan user.');
      },
    });
  }
}
