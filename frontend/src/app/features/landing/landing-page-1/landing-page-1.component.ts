import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PublicPortfolio, PublicSkill } from '../public-portfolio.service';
import { formatPeriod } from '../../../shared/utils/month-format.util';

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
  selector: 'app-landing-page-1',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing-page-1.component.html',
  styleUrl: './landing-page-1.component.scss',
})
export class LandingPage1Component implements AfterViewInit, OnDestroy {
  @Input({ required: true }) portfolio!: PublicPortfolio;

  currentYear = new Date().getFullYear();
  private observer: IntersectionObserver | null = null;

  constructor(
    private host: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupScrollReveal();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  formatPeriod(startDate: string, endDate: string | null): string {
    return formatPeriod(startDate, endDate);
  }

  initial(): string {
    const source = this.portfolio?.profile?.full_name || this.portfolio?.username || '?';
    return source.charAt(0).toUpperCase();
  }

  displayName(): string {
    return this.portfolio?.profile?.full_name || this.portfolio?.username || 'Portfolio';
  }

  primaryRole(): string {
    return this.portfolio?.profile?.position || 'Professional Portfolio';
  }

  heroSummary(): string {
    return 'Membangun backend yang stabil, terstruktur, dan siap dikembangkan, mulai dari API, database, server setup, sampai proses migration data yang rapi.';
  }

  normalizedAboutMe(): string {
    return (this.portfolio?.profile?.about_me || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ');
  }

  topSkills(limit = 4): PublicSkill[] {
    return this.portfolio?.skills.slice(0, limit) ?? [];
  }

  latestExperienceCompany(): string | null {
    return this.portfolio?.work_histories[0]?.company_name ?? null;
  }

  hasAnyPortfolioSection(): boolean {
    return Boolean(
      this.portfolio?.profile?.about_me ||
        this.portfolio?.skills.length ||
        this.portfolio?.work_histories.length ||
        this.portfolio?.educations.length,
    );
  }

  skillGroups(): SkillGroup[] {
    return SKILL_TYPE_ORDER.map((type) => ({
      label: SKILL_TYPE_LABELS[type],
      skills: this.portfolio.skills.filter((skill) => skill.type === type),
    })).filter((group) => group.skills.length > 0);
  }

  metrics(): PortfolioMetric[] {
    const firstExperienceYear = this.portfolio.work_histories
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
      this.portfolio.skills.length
        ? { label: 'Skills Curated', value: `${this.portfolio.skills.length}`, icon: 'star' }
        : null,
      this.portfolio.educations.length
        ? { label: 'Education Records', value: `${this.portfolio.educations.length}`, icon: 'graduation-cap' }
        : null,
      this.portfolio.profile?.city
        ? { label: 'Based In', value: this.portfolio.profile.city, icon: 'map-pin' }
        : null,
    ].filter((metric): metric is PortfolioMetric => metric !== null);
  }

  contactActions(): ContactAction[] {
    const profile = this.portfolio.profile;
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

  private setupScrollReveal(): void {
    this.observer?.disconnect();

    const revealItems = this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal-on-scroll');
    if (!revealItems.length) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            } else {
              entry.target.classList.remove('is-visible');
            }
          }
        },
        {
          rootMargin: '-6% 0px -6% 0px',
          threshold: 0.14,
        },
      );

      revealItems.forEach((item) => this.observer?.observe(item));
    });
  }
}
