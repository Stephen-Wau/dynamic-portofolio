import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'auth_token';

interface LoginResponse {
  token: string;
  expires_at: string;
}

export interface CurrentUser {
  id: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Dipakai komponen buat tampilkan status login reaktif tanpa polling localStorage.
  isLoggedIn = signal(this.hasValidToken());

  constructor(private http: HttpClient) {}

  // Login ke BE, simpan token kalau sukses. Dipakai LoginComponent.
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this.isLoggedIn.set(true);
        }),
      );
  }

  // Hapus token & update status login. Dipakai tombol logout di dashboard.
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
  }

  // Ambil identitas user dari BE menggunakan token tersimpan. Dipakai dashboard saat load.
  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/api/auth/me`);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Dipakai guard & interceptor buat cek apakah token ada dan belum expired.
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodePayload(token);
    if (!payload?.exp) return false;

    return payload.exp * 1000 > Date.now();
  }

  // Decode payload JWT (base64url) tanpa library tambahan, cuma butuh field `exp`.
  private decodePayload(token: string): { exp?: number } | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}
