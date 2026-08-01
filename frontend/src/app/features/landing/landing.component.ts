import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  PublicPortfolio,
  PublicPortfolioService,
  PublicSkill,
} from './public-portfolio.service';
import { formatPeriod } from '../../shared/utils/month-format.util';

const SKILL_TYPE_LABELS: Record<string, string> = {
  hard_skill: 'Core Expertise',
  software_skill: 'Tools & Platforms',
  soft_skill: 'Soft Skills',
};

const SKILL_TYPE_ORDER = ['hard_skill', 'software_skill', 'soft_skill'];

interface SkillGroup {
  label: string;
  skills: PublicSkill[];
}

interface PortfolioMetric {
  label: string;
  value: string;
  icon: string;
}

interface ContactAction {
  label: string;
  value: string;
  href: string;
  icon: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  isLoading = true;
  loadFailed = false;
  data: PublicPortfolio | null = null;
  skillGroups: SkillGroup[] = [];
  metrics: PortfolioMetric[] = [];
  contactActions: ContactAction[] = [];
  currentYear = new Date().getFullYear();

  constructor(private portfolioService: PublicPortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.get().subscribe({
      next: (data) => {
        this.data = data;
        this.skillGroups = this.groupSkills(data.skills);
        this.metrics = this.buildMetrics(data);
        this.contactActions = this.buildContactActions(data);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadFailed = true;
      },
    });
  }

  formatPeriod(startDate: string, endDate: string | null): string {
    return formatPeriod(startDate, endDate);
  }

  initial(): string {
    const source = this.data?.profile?.full_name || this.data?.username || '?';
    return source.charAt(0).toUpperCase();
  }

  displayName(): string {
    return this.data?.profile?.full_name || this.data?.username || 'Portfolio';
  }

  primaryRole(): string {
    const firstHardSkill = this.data?.skills.find((skill) => skill.type === 'hard_skill')?.title;
    if (firstHardSkill) {
      return `${firstHardSkill} Specialist`;
    }

    return 'Creative Professional';
  }

  heroSummary(): string {
    const profile = this.data?.profile;
    const parts = [
      profile?.city ? `berbasis di ${profile.city}` : '',
      this.data?.work_histories.length ? `${this.data.work_histories.length} pengalaman profesional` : '',
      this.data?.educations.length ? `${this.data.educations.length} riwayat pendidikan` : '',
    ].filter(Boolean);

    if (parts.length === 0) {
      return 'Landing page ini otomatis mengambil data user aktif yang dipilih dari menu settings.';
    }

    return `Menyusun cerita profesional yang rapi dan mudah dipindai, ${parts.join(' dan ')}.`;
  }

  topSkills(limit = 4): PublicSkill[] {
    return this.data?.skills.slice(0, limit) ?? [];
  }

  latestExperienceCompany(): string | null {
    return this.data?.work_histories[0]?.company_name ?? null;
  }

  hasAnyPortfolioSection(): boolean {
    return Boolean(
      this.data?.profile?.about_me ||
        this.data?.skills.length ||
        this.data?.work_histories.length ||
        this.data?.educations.length,
    );
  }

  private groupSkills(skills: PublicSkill[]): SkillGroup[] {
    return SKILL_TYPE_ORDER.map((type) => ({
      label: SKILL_TYPE_LABELS[type],
      skills: skills.filter((skill) => skill.type === type),
    })).filter((group) => group.skills.length > 0);
  }

  private buildMetrics(data: PublicPortfolio): PortfolioMetric[] {
    const firstExperienceYear = data.work_histories
      .map((item) => Number(item.start_date.slice(0, 4)))
      .filter((year) => !Number.isNaN(year))
      .sort((a, b) => a - b)[0];

    const yearsOfExperience =
      firstExperienceYear && firstExperienceYear <= this.currentYear
        ? `${Math.max(1, this.currentYear - firstExperienceYear)}+`
        : null;

    return [
      yearsOfExperience
        ? { label: 'Years Experience', value: yearsOfExperience, icon: 'briefcase' }
        : null,
      data.skills.length
        ? { label: 'Skills Curated', value: `${data.skills.length}`, icon: 'star' }
        : null,
      data.educations.length
        ? { label: 'Education Records', value: `${data.educations.length}`, icon: 'graduation-cap' }
        : null,
      data.profile?.city
        ? { label: 'Based In', value: data.profile.city, icon: 'map-pin' }
        : null,
    ].filter((metric): metric is PortfolioMetric => metric !== null);
  }

  private buildContactActions(data: PublicPortfolio): ContactAction[] {
    const profile = data.profile;
    if (!profile) {
      return [];
    }

    return [
      profile.email
        ? {
            label: 'Email',
            value: profile.email,
            href: `mailto:${profile.email}`,
            icon: 'mail',
          }
        : null,
      profile.wa_number
        ? {
            label: 'WhatsApp',
            value: profile.wa_number,
            href: `https://wa.me/${profile.wa_number.replace(/\D/g, '')}`,
            icon: 'message-circle',
          }
        : null,
      profile.linkedin
        ? {
            label: 'LinkedIn',
            value: this.cleanLabel(profile.linkedin),
            href: this.normalizeUrl(profile.linkedin),
            icon: 'linkedin',
          }
        : null,
      profile.github
        ? {
            label: 'GitHub',
            value: this.cleanLabel(profile.github),
            href: this.normalizeUrl(profile.github),
            icon: 'github',
          }
        : null,
    ].filter((item): item is ContactAction => item !== null);
  }

  private normalizeUrl(value: string): string {
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    return `https://${value}`;
  }

  private cleanLabel(value: string): string {
    return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}
