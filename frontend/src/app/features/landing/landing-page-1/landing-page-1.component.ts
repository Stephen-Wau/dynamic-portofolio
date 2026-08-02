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
import { PublicPortfolio, PublicSkill, PublicTechnicalProject } from '../public-portfolio.service';
import { formatPeriod } from '../../../shared/utils/month-format.util';
import { openFilePreview } from '../../../shared/utils/blob-url.util';

const SKILL_TYPE_LABELS: Record<string, string> = {
  hard_skill: 'Core Expertise',
  software_skill: 'Tools & Platforms',
  soft_skill: 'Soft Skills',
};

const SKILL_TYPE_ORDER = ['hard_skill', 'software_skill', 'soft_skill'];

interface SkillGroup {
  type: string;
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
  // Project yang lagi dibuka di modal detail (null = modal tertutup).
  selectedProject: PublicTechnicalProject | null = null;
  // Hasil pengukuran DOM: berapa chip tech stack yang beneran muat di 2 baris per project
  // (keyed by project.id), plus sisanya buat chip "+N". Diisi setelah view render (lihat
  // recomputeProjectTechOverflow) — kosong dulu = fallback nampilin semua chip apa adanya.
  private projectTechOverflow: Record<number, { visible: string[]; hiddenCount: number }> = {};
  private observer: IntersectionObserver | null = null;
  private techOverflowResizeObserver: ResizeObserver | null = null;
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
    this.setupProjectTechOverflow();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.techOverflowResizeObserver?.disconnect();
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
        this.portfolio?.educations.length ||
        this.portfolio?.technical_projects.length,
    );
  }

  private cachedSkillGroups: SkillGroup[] | null = null;
  private cachedSkillGroupsSource: PublicSkill[] | null = null;

  skillGroups(): SkillGroup[] {
    if (this.cachedSkillGroupsSource !== this.portfolio.skills) {
      this.cachedSkillGroupsSource = this.portfolio.skills;
      this.cachedSkillGroups = SKILL_TYPE_ORDER.map((type) => ({
        type,
        label: SKILL_TYPE_LABELS[type],
        skills: this.portfolio.skills.filter((skill) => skill.type === type),
      })).filter((group) => group.skills.length > 0);
    }

    return this.cachedSkillGroups!;
  }

  trackBySkillType(_index: number, group: SkillGroup): string {
    return group.type;
  }

  trackBySkillId(_index: number, skill: PublicSkill): number {
    return skill.id;
  }

  trackByProjectId(_index: number, project: PublicTechnicalProject): number {
    return project.id;
  }

  // tech_stack disimpan sebagai satu string comma-separated di BE (bukan tabel pivot kayak
  // key_contributions/files), jadi di-split di sini biar bisa dirender per-chip kayak skill-tag.
  projectTechStack(project: PublicTechnicalProject): string[] {
    return project.tech_stack
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }

  // Card di grid cuma nampilin chip tech stack yang beneran muat di 2 baris (diukur dari DOM,
  // lihat recomputeProjectTechOverflow) — sebelum pengukuran selesai, fallback nampilin semua
  // chip apa adanya (CSS max-height di .project-card__tags jaga-jaga biar gak sempat "meledak"
  // ke banyak baris selama sesaat itu). Daftar lengkapnya tetap kelihatan di modal "Show".
  projectCardTechStack(project: PublicTechnicalProject): string[] {
    return this.projectTechOverflow[project.id]?.visible ?? this.projectTechStack(project);
  }

  projectCardTechOverflowCount(project: PublicTechnicalProject): number {
    return this.projectTechOverflow[project.id]?.hiddenCount ?? 0;
  }

  // Ukur DOM buat nentuin berapa chip tech stack yang beneran muat di 2 baris per project card
  // (lebar card beda-beda tergantung breakpoint, dan panjang nama tech juga beda-beda — gak bisa
  // ditentuin dari angka tetap kayak "maks 5 chip"). Dijalanin sekali di ngAfterViewInit (di-defer
  // lewat setTimeout biar gak nulis ke binding di siklus CD yang sama, kalau enggak Angular bakal
  // nge-throw ExpressionChangedAfterItHasBeenCheckedError), lalu diulang tiap kali lebar berubah.
  private setupProjectTechOverflow(): void {
    if (!this.portfolio?.technical_projects?.length) {
      return;
    }

    setTimeout(() => this.recomputeProjectTechOverflow());

    this.ngZone.runOutsideAngular(() => {
      this.techOverflowResizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.recomputeProjectTechOverflow());
      });
      this.techOverflowResizeObserver.observe(this.host.nativeElement);
    });
  }

  private recomputeProjectTechOverflow(): void {
    const measureRows = this.host.nativeElement.querySelectorAll<HTMLElement>(
      '.project-card__tags--measure',
    );
    const nextState: Record<number, { visible: string[]; hiddenCount: number }> = {};

    measureRows.forEach((row) => {
      const projectId = Number(row.dataset['projectId']);
      const project = this.portfolio.technical_projects.find((p) => p.id === projectId);
      const chips = Array.from(row.children) as HTMLElement[];
      if (!project || !chips.length) {
        return;
      }

      const allTags = this.projectTechStack(project);

      // offsetTop tiap chip dipakai buat ngelompokin baris: chip dengan offsetTop yang sama
      // berarti satu baris. rowLimitTop = offsetTop baris ke-2 (atau baris ke-1 kalau semua
      // chip muat di 1 baris), jadi cutoff = jumlah chip yang offsetTop-nya <= itu.
      const tops = chips.map((chip) => chip.offsetTop);
      const firstRowTop = tops[0];
      const secondRowTop = tops.find((top) => top > firstRowTop) ?? firstRowTop;
      let cutoff = tops.filter((top) => top <= secondRowTop).length;

      if (cutoff >= allTags.length) {
        nextState[projectId] = { visible: allTags, hiddenCount: 0 };
        return;
      }

      // Sisain 1 slot di baris ke-2 buat chip "+N" itu sendiri, biar dia gak numpuk jadi baris ke-3.
      cutoff = Math.max(1, cutoff - 1);
      nextState[projectId] = {
        visible: allTags.slice(0, cutoff),
        hiddenCount: allTags.length - cutoff,
      };
    });

    this.projectTechOverflow = nextState;
  }

  openProjectModal(project: PublicTechnicalProject): void {
    this.selectedProject = project;
  }

  closeProjectModal(): void {
    this.selectedProject = null;
  }

  // Buka file lampiran project di tab baru (lihat blob-url.util.ts buat alasan gak pakai
  // <a href="data:..."> langsung).
  previewProjectFile(fileData: string): void {
    openFilePreview(fileData);
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

    // Hysteresis band: many decorative elements on this page run infinite CSS
    // animations (glow/orbit/pulse) that continuously nudge layout by a pixel
    // or two. With a single threshold, that jitter alone crosses the boundary
    // back and forth and toggles `is-visible` nonstop even while the user
    // isn't scrolling. Requiring a big gap between the "show" and "hide"
    // ratios means ambient jitter never spans both, only a real scroll does.
    const SHOW_RATIO = 0.2;
    const HIDE_RATIO = 0.02;

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const wasVisible = target.classList.contains('is-visible');

            if (!wasVisible && entry.intersectionRatio >= SHOW_RATIO) {
              target.classList.add('is-visible');
            } else if (wasVisible && entry.intersectionRatio <= HIDE_RATIO) {
              target.classList.remove('is-visible');
            }
          }
        },
        {
          rootMargin: '-6% 0px -6% 0px',
          threshold: [0, HIDE_RATIO, 0.05, 0.1, 0.15, SHOW_RATIO, 0.4, 0.6, 0.8, 1],
        },
      );

      revealItems.forEach((item) => this.observer?.observe(item));
    });
  }
}
