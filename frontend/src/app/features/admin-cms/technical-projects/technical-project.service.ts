import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DataTableQuery, PagedResult } from '../../../shared/ui/data-table/data-table.component';

export interface TechnicalProjectFile {
  id?: number;
  file_name: string;
  file_data: string; // base64 data URI
}

export interface TechnicalProject {
  id: number;
  user_id: number;
  name_project: string;
  user_role: string;
  description: string;
  tech_stack: string;
  key_contributions: string[];
  files: TechnicalProjectFile[];
}

export type TechnicalProjectPayload = Omit<TechnicalProject, 'id' | 'user_id'>;

// Hit API /api/technical-projects milik user yang sedang login. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class TechnicalProjectService {
  private baseUrl = `${environment.apiUrl}/api/technical-projects`;

  constructor(private http: HttpClient) {}

  // Ambil technical project milik user yang login, dipakai isi tabel. `query` diteruskan apa
  // adanya sebagai query string ke BE (?searchword=...&sort_by=...&sort_dir=...&page=...&per_page=...),
  // BE yang search/sort/paginate. Response dibungkus {data, meta} (meta.total buat pager FE).
  list(query: DataTableQuery = {}): Observable<PagedResult<TechnicalProject>> {
    let params = new HttpParams();
    if (query.searchword) params = params.set('searchword', query.searchword);
    if (query.sort_by) params = params.set('sort_by', query.sort_by);
    if (query.sort_dir) params = params.set('sort_dir', query.sort_dir);
    if (query.page) params = params.set('page', query.page);
    if (query.per_page) params = params.set('per_page', query.per_page);

    return this.http.get<PagedResult<TechnicalProject>>(this.baseUrl, { params });
  }

  // Bikin technical project baru. BE balikin 400 (plain text) kalau key_contributions kosong.
  create(payload: TechnicalProjectPayload): Observable<TechnicalProject> {
    return this.http.post<TechnicalProject>(this.baseUrl, payload);
  }

  // Update technical project existing. Validasi sama seperti create.
  update(id: number, payload: TechnicalProjectPayload): Observable<TechnicalProject> {
    return this.http.put<TechnicalProject>(`${this.baseUrl}/${id}`, payload);
  }

  // Hapus technical project (key contribution & file-nya ikut kehapus di BE lewat cascade).
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
