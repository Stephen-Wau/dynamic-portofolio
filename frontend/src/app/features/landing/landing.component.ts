import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface HealthResponse {
  api: string;
  database: string;
}

// Landing page publik (route ''). Placeholder health-check, nanti diganti konten portofolio.
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  title = 'Dynamic Portofolio';
  apiStatus = 'checking...';
  databaseStatus = 'checking...';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<HealthResponse>(`${environment.apiUrl}/health`).subscribe({
      next: (res) => {
        this.apiStatus = res.api;
        this.databaseStatus = res.database;
      },
      error: () => {
        this.apiStatus = 'unreachable';
        this.databaseStatus = 'unreachable';
      },
    });
  }
}
