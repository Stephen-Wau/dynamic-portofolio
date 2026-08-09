import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PublicPortfolio, PublicPortfolioService } from './public-portfolio.service';
import { STATIC_PORTFOLIO } from './static-portfolio-data';
import { LandingPage1Component } from './landing-page-1/landing-page-1.component';
import { LandingPage2Component } from './landing-page-2/landing-page-2.component';
import { LandingPage3Component } from './landing-page-3/landing-page-3.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LandingPage1Component, LandingPage2Component, LandingPage3Component],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  isLoading = true;
  loadFailed = false;
  data: PublicPortfolio | null = null;

  constructor(private portfolioService: PublicPortfolioService) {}

  ngOnInit(): void {
    if (environment.useStaticData) {
      this.data = {
        ...STATIC_PORTFOLIO,
        active_landing_page: `landing_page_${environment.staticLandingPage}`,
      };
      this.isLoading = false;
      return;
    }

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
