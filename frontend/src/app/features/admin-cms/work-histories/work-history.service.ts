import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DataTableQuery, PagedResult } from '../../../shared/ui/data-table/data-table.component';

export interface WorkHistory {
  id: number;
  user_id: number;
  company_name: string;
  position: string;
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

  // Ambil riwayat kerja milik user yang login, dipakai isi tabel. `query` diteruskan apa adanya
  // sebagai query string ke BE (?searchword=...&sort_by=...&sort_dir=...&page=...&per_page=...),
  // BE yang search/sort/paginate. Response dibungkus {data, meta} (meta.total buat pager FE).
  list(query: DataTableQuery = {}): Observable<PagedResult<WorkHistory>> {
    let params = new HttpParams();
    if (query.searchword) params = params.set('searchword', query.searchword);
    if (query.sort_by) params = params.set('sort_by', query.sort_by);
    if (query.sort_dir) params = params.set('sort_dir', query.sort_dir);
    if (query.page) params = params.set('page', query.page);
    if (query.per_page) params = params.set('per_page', query.per_page);

    return this.http.get<PagedResult<WorkHistory>>(this.baseUrl, { params });
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
