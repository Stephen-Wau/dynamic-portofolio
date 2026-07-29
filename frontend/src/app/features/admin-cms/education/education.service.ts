import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DataTableQuery, PagedResult } from '../../../shared/ui/data-table/data-table.component';

export interface Education {
  id: number;
  user_id: number;
  place: string;
  major: string;
  start_date: string; // "YYYY-MM"
  end_date: string | null; // null = masih menempuh pendidikan
}

export type EducationPayload = Omit<Education, 'id' | 'user_id'>;

// Hit API /api/educations milik user yang sedang login. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class EducationService {
  private baseUrl = `${environment.apiUrl}/api/educations`;

  constructor(private http: HttpClient) {}

  // Ambil riwayat pendidikan milik user yang login, dipakai isi tabel. `query` diteruskan apa
  // adanya sebagai query string ke BE (?searchword=...&sort_by=...&sort_dir=...&page=...&per_page=...),
  // BE yang search/sort/paginate. Response dibungkus {data, meta} (meta.total buat pager FE).
  list(query: DataTableQuery = {}): Observable<PagedResult<Education>> {
    let params = new HttpParams();
    if (query.searchword) params = params.set('searchword', query.searchword);
    if (query.sort_by) params = params.set('sort_by', query.sort_by);
    if (query.sort_dir) params = params.set('sort_dir', query.sort_dir);
    if (query.page) params = params.set('page', query.page);
    if (query.per_page) params = params.set('per_page', query.per_page);

    return this.http.get<PagedResult<Education>>(this.baseUrl, { params });
  }

  // Bikin riwayat pendidikan baru.
  create(payload: EducationPayload): Observable<Education> {
    return this.http.post<Education>(this.baseUrl, payload);
  }

  // Update riwayat pendidikan existing.
  update(id: number, payload: EducationPayload): Observable<Education> {
    return this.http.put<Education>(`${this.baseUrl}/${id}`, payload);
  }

  // Hapus riwayat pendidikan.
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
