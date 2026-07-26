import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface HealthResponse {
  api: string;
  database: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Dynamic Portofolio';
  apiStatus = 'checking...';
  databaseStatus = 'checking...';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<HealthResponse>('http://localhost:8080/health').subscribe({
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
