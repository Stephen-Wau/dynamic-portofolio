import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicProfile {
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

export interface PublicWorkHistory {
  id: number;
  company_name: string;
  position: string;
  start_date: string;
  end_date: string | null;
  points: string[];
}

export interface PublicEducation {
  id: number;
  place: string;
  major: string;
  start_date: string;
  end_date: string | null;
}

export interface PublicSkill {
  id: number;
  title: string;
  type: 'soft_skill' | 'hard_skill' | 'software_skill';
}

export interface PublicPortfolio {
  active_landing_page: string;
  username: string;
  profile: PublicProfile | null;
  work_histories: PublicWorkHistory[];
  educations: PublicEducation[];
  skills: PublicSkill[];
}

// Hit API publik /api/public/portfolio (TANPA auth) — dipakai landing page. Balikin data user
// yang lagi di-set sebagai "featured user" lewat menu Settings di CMS.
@Injectable({ providedIn: 'root' })
export class PublicPortfolioService {
  constructor(private http: HttpClient) {}

  get(): Observable<PublicPortfolio> {
    return this.http.get<PublicPortfolio>(`${environment.apiUrl}/api/public/portfolio`);
  }
}
