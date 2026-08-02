import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PublicPortfolio, PublicPortfolioService } from './public-portfolio.service';
import { LandingPage1Component } from './landing-page-1/landing-page-1.component';
import { LandingPage2Component } from './landing-page-2/landing-page-2.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LandingPage1Component, LandingPage2Component],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  isLoading = true;
  loadFailed = false;
  data: PublicPortfolio | null = null;

  constructor(private portfolioService: PublicPortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.get().subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadFailed = true;
      },
    });
  }

  activeLandingPage(): string {
    return this.data?.active_landing_page || 'landing_page_1';
  }
}
