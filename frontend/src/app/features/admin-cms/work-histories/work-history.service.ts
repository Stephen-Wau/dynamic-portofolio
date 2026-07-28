import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WorkHistory {
  id: number;
  user_id: number;
  company_name: string;
  start_date: string; // "YYYY-MM"
  end_date: string | null; // null = masih berlangsung
  points: string[];
}

export type WorkHistoryPayload = Omit<WorkHistory, 'id' | 'user_id'>;

// Hit API /api/work-histories milik user yang sedang login. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class WorkHistoryService {
  private baseUrl = `${environment.apiUrl}/api/work-histories`;

  constructor(private http: HttpClient) {}

  // Ambil semua riwayat kerja milik user yang login, dipakai isi tabel.
  list(): Observable<WorkHistory[]> {
    return this.http.get<WorkHistory[]>(this.baseUrl);
  }

  // Bikin riwayat kerja baru. BE balikin 409 (plain text) kalau tanggalnya overlap.
  create(payload: WorkHistoryPayload): Observable<WorkHistory> {
    return this.http.post<WorkHistory>(this.baseUrl, payload);
  }

  // Update riwayat kerja existing. Sama kayak create, bisa 409 kalau tanggal baru overlap.
  update(id: number, payload: WorkHistoryPayload): Observable<WorkHistory> {
    return this.http.put<WorkHistory>(`${this.baseUrl}/${id}`, payload);
  }

  // Hapus riwayat kerja (poin-poinnya ikut kehapus di BE lewat cascade).
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
