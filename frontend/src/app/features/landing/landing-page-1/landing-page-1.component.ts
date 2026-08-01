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

interface HeroCommand {
  prompt: string;
  command: string;
  note: string;
  outputs: string[];
}

const STACK_KEYWORDS = [
  'laravel',
  'php',
  'golang',
  'go',
  'mysql',
  'postgresql',
  'postgres',
  'redis',
  'docker',
  'nginx',
  'linux',
  'git',
  'rest api',
  'api',
];

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
  sshPrompt = '';
  sshCommand = '';
  sshNote = '';
  sshOutputs: string[] = [];
  private observer: IntersectionObserver | null = null;
  private sshTimers: number[] = [];

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
    this.startSshSequence();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.clearSshTimers();
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
    return 'Berfokus membangun backend yang stabil, aman, dan mudah dikembangkan, mencakup API, database, otomasi deployment, server setup, hingga alur migrasi data yang tertata.';
  }

  heroBadgeItems(): string[] {
    return [this.primaryRole(), this.stackFocus(), this.operationsFocus()];
  }

  stackFocus(): string {
    const stackMatches = this.portfolio.skills
      .map((skill) => skill.title.trim())
      .filter((title) =>
        STACK_KEYWORDS.some((keyword) => title.toLowerCase().includes(keyword)),
      )
      .slice(0, 3);

    return stackMatches.length > 0 ? stackMatches.join(', ') : 'Laravel, PHP, Golang';
  }

  operationsFocus(): string {
    return 'API, Server Ops, DB Migration';
  }

  heroCommands(): HeroCommand[] {
    return [
      {
        prompt: 'root@prod-api-01:~#',
        command: 'sudo apt install nginx certbot -y',
        note: 'Provisioning web server dependencies',
        outputs: ['Reading package lists... done', 'nginx and certbot installed successfully'],
      },
      {
        prompt: 'deploy@web-02:/var/www/app$',
        command: 'nginx -t && systemctl reload nginx',
        note: 'Validating config and reloading gracefully',
        outputs: ['nginx: configuration file /etc/nginx/nginx.conf test is successful', 'service nginx reloaded'],
      },
      {
        prompt: 'deploy@release:/srv/www/current$',
        command: 'ln -sfn /srv/www/releases/20260801 /srv/www/current',
        note: 'Switching symlink to latest release',
        outputs: ['release symlink updated', 'current -> /srv/www/releases/20260801'],
      },
      {
        prompt: 'ops@db-migration:~$',
        command: 'php artisan migrate --force',
        note: 'Applying schema changes safely',
        outputs: ['Migrating: 2026_08_01_000001_update_profiles_table', 'Migration completed successfully'],
      },
    ];
  }

  private startSshSequence(): void {
    const commands = this.heroCommands();
    if (!commands.length) {
      return;
    }

    let commandIndex = 0;

    const runSequence = () => {
      const item = commands[commandIndex];
      this.sshPrompt = item.prompt;
      this.sshCommand = '';
      this.sshNote = '';
      this.sshOutputs = [];

      let charIndex = 0;
      const typingTimer = window.setInterval(() => {
        charIndex += 1;
        this.sshCommand = item.command.slice(0, charIndex);

        if (charIndex >= item.command.length) {
          window.clearInterval(typingTimer);

          const afterTypingTimer = window.setTimeout(() => {
            this.sshNote = item.note;

            item.outputs.forEach((output, outputIndex) => {
              const outputTimer = window.setTimeout(() => {
                this.sshOutputs = [...this.sshOutputs, output];
              }, outputIndex * 420);

              this.sshTimers.push(outputTimer);
            });

            const totalOutputDuration = item.outputs.length * 420;
            const nextTimer = window.setTimeout(() => {
              this.sshPrompt = '';
              this.sshCommand = '';
              this.sshNote = '';
              this.sshOutputs = [];
              commandIndex = (commandIndex + 1) % commands.length;
              runSequence();
            }, totalOutputDuration + 1500);

            this.sshTimers.push(nextTimer);
          }, 260);

          this.sshTimers.push(afterTypingTimer);
        }
      }, 34);

      this.sshTimers.push(typingTimer);
    };

    runSequence();
  }

  private clearSshTimers(): void {
    this.sshTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
      window.clearInterval(timerId);
    });
    this.sshTimers = [];
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
