import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SettingsUser {
  id: number;
  username: string;
  full_name: string;
  image: string;
}

export interface FeaturedUserResponse {
  user_id: number | null;
}

// Hit API /api/settings/* — pengaturan global aplikasi (bukan per-user), ex: user mana yang
// lagi ditampilkan di landing page publik. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private baseUrl = `${environment.apiUrl}/api/settings`;

  constructor(private http: HttpClient) {}

  // Daftar semua user buat card picker.
  listUsers(): Observable<SettingsUser[]> {
    return this.http.get<SettingsUser[]>(`${this.baseUrl}/users`);
  }

  // Ambil user yang lagi dipilih buat ditampilkan di landing page publik (null kalau belum di-set).
  getFeaturedUser(): Observable<FeaturedUserResponse> {
    return this.http.get<FeaturedUserResponse>(`${this.baseUrl}/featured-user`);
  }

  // Set user yang dipilih.
  setFeaturedUser(userId: number): Observable<FeaturedUserResponse> {
    return this.http.put<FeaturedUserResponse>(`${this.baseUrl}/featured-user`, { user_id: userId });
  }
}
