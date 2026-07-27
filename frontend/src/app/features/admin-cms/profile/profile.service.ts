import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Profile {
  user_id: number;
  full_name: string;
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
  constructor(private http: HttpClient) {}

  // Ambil profil user, balikin objek kosong kalau belum pernah diisi (bukan 404).
  get(): Observable<Profile> {
    return this.http.get<Profile>(`${environment.apiUrl}/api/profile`);
  }

  // Simpan profil, create kalau belum ada, update kalau sudah ada (upsert di BE).
  save(profile: Omit<Profile, 'user_id'>): Observable<Profile> {
    return this.http.post<Profile>(`${environment.apiUrl}/api/profile`, profile);
  }
}
