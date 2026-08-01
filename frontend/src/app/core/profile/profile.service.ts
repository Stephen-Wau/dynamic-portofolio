import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  user_id: number;
  full_name: string;
  position: string;
  email: string;
  wa_number: string;
  linkedin: string;
  github: string;
  city: string;
  about_me: string;
  image: string;
}

// Hit API /api/profile milik user yang sedang login. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class ProfileService {
  // Dipakai sidebar buat nampilin foto profil tanpa nge-fetch ulang tiap navigasi.
  image = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // Ambil profil user, balikin objek kosong kalau belum pernah diisi (bukan 404).
  get(): Observable<Profile> {
    return this.http
      .get<Profile>(`${environment.apiUrl}/api/profile`)
      .pipe(tap((profile) => this.image.set(profile.image || null)));
  }

  // Simpan profil, create kalau belum ada, update kalau sudah ada (upsert di BE).
  save(profile: Omit<Profile, 'user_id'>): Observable<Profile> {
    return this.http
      .post<Profile>(`${environment.apiUrl}/api/profile`, profile)
      .pipe(tap((saved) => this.image.set(saved.image || null)));
  }
}
