import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import {
  ActiveLandingPageResponse,
  LandingPageOption,
  SettingsService,
  SettingsUser,
} from './settings.service';
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
  landingOptions: LandingPageOption[] = [];
  activeLandingPage = '';
  isLoading = true;
  // Simpan id yang lagi diproses biar tombol itu doang yang nunjukin loading, bukan semua card.
  savingUserId: number | null = null;
  savingLandingPageId: string | null = null;

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
      landingPage: this.settingsService.getActiveLandingPage(),
    }).subscribe({
      next: ({ users, featured, landingPage }) => {
        this.users = users;
        this.featuredUserId = featured.user_id;
        this.applyLandingPageState(landingPage);
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

  selectLandingPage(option: LandingPageOption): void {
    if (option.id === this.activeLandingPage || this.savingLandingPageId) return;

    this.savingLandingPageId = option.id;
    this.settingsService.setActiveLandingPage(option.id).subscribe({
      next: (response) => {
        this.savingLandingPageId = null;
        this.applyLandingPageState(response);
        this.toast.success(`${option.name} sekarang menjadi landing page aktif.`);
      },
      error: () => {
        this.savingLandingPageId = null;
        this.toast.error('Gagal menyimpan pilihan landing page.');
      },
    });
  }

  private applyLandingPageState(response: ActiveLandingPageResponse): void {
    this.activeLandingPage = response.active_landing_page;
    this.landingOptions = response.options;
  }
}
