import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DataTableQuery, PagedResult } from '../../../shared/ui/data-table/data-table.component';

// 3 kategori skill yang di-hardcode (sesuai kontrak BE) — bukan dari tabel/config terpisah
// karena kategorinya emang fix.
export type SkillType = 'soft_skill' | 'hard_skill' | 'software_skill';

export interface Skill {
  id: number;
  user_id: number;
  title: string;
  type: SkillType;
}

export type SkillPayload = Omit<Skill, 'id' | 'user_id'>;

// Hit API /api/user-skills milik user yang sedang login. Auth header nempel otomatis lewat authInterceptor.
@Injectable({ providedIn: 'root' })
export class SkillService {
  private baseUrl = `${environment.apiUrl}/api/user-skills`;

  constructor(private http: HttpClient) {}

  // Ambil skill milik user yang login, dipakai isi tabel. `query` diteruskan apa adanya sebagai
  // query string ke BE (?searchword=...&sort_by=...&sort_dir=...&page=...&per_page=...), BE yang
  // search/sort/paginate. Response dibungkus {data, meta} (meta.total buat pager FE).
  list(query: DataTableQuery = {}): Observable<PagedResult<Skill>> {
    let params = new HttpParams();
    if (query.searchword) params = params.set('searchword', query.searchword);
    if (query.sort_by) params = params.set('sort_by', query.sort_by);
    if (query.sort_dir) params = params.set('sort_dir', query.sort_dir);
    if (query.page) params = params.set('page', query.page);
    if (query.per_page) params = params.set('per_page', query.per_page);

    return this.http.get<PagedResult<Skill>>(this.baseUrl, { params });
  }

  // Bikin skill baru. BE balikin 409 (plain text) kalau title-nya udah dipakai user ini.
  create(payload: SkillPayload): Observable<Skill> {
    return this.http.post<Skill>(this.baseUrl, payload);
  }

  // Update skill existing. Sama kayak create, bisa 409 kalau title baru bentrok.
  update(id: number, payload: SkillPayload): Observable<Skill> {
    return this.http.put<Skill>(`${this.baseUrl}/${id}`, payload);
  }

  // Hapus skill.
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
