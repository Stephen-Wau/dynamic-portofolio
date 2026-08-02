import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
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

interface StatCounter {
  label: string;
  icon: string;
  suffix: string;
  target: number;
  current: number;
}

interface ContactAction {
  label: string;
  value: string;
  href: string;
  icon: string;
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

// Landing page 2: tema ungu-hitam gradien, lebih banyak efek animasi/rotasi dibanding
// landing-page-1 (glow orbit, tilt 3D, marquee, animated counter) — dipilih user lewat
// Settings > Active Landing Page. Struktur konten sengaja disamakan dengan landing-page-1
// (Hero/About/Skills/Projects/Experience/Education/Contact) supaya kedua mode landing page
// tetap konsisten menampilkan seluruh data CMS, bedanya cuma di presentasi visualnya.
@Component({
  selector: 'app-landing-page-2',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing-page-2.component.html',
  styleUrl: './landing-page-2.component.scss',
})
export class LandingPage2Component implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) portfolio!: PublicPortfolio;

  currentYear = new Date().getFullYear();
  selectedProject: PublicTechnicalProject | null = null;
  statCounters: StatCounter[] = [];

  private observer: IntersectionObserver | null = null;
  private statObserver: IntersectionObserver | null = null;
  private techOverflowResizeObserver: ResizeObserver | null = null;
  private tiltCleanups: Array<() => void> = [];
  private countersAnimated = false;
  private cachedSkillGroups: SkillGroup[] | null = null;
  private cachedSkillGroupsSource: PublicSkill[] | null = null;
  private projectTechOverflow: Record<number, { visible: string[]; hiddenCount: number }> = {};

  constructor(
    private host: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  // buildStatCounters() harus jalan di ngOnInit (sebelum render pertama), BUKAN ngAfterViewInit
  // (setelah render pertama) — Angular udah nge-check *ngIf="statCounters.length > 0" & *ngFor
  // sekali pas view-init selesai; kalau statCounters baru diisi ngAfterViewInit, itu ngubah
  // binding yang udah "final" di cycle yang sama → ExpressionChangedAfterItHasBeenCheckedError.
  ngOnInit(): void {
    this.buildStatCounters();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupScrollReveal();
    this.setupStatCounterObserver();
    this.setupTiltEffect();
    this.setupProjectTechOverflow();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.statObserver?.disconnect();
    this.techOverflowResizeObserver?.disconnect();
    this.tiltCleanups.forEach((cleanup) => cleanup());
    this.tiltCleanups = [];
  }

  // ---------- Identitas & hero ----------

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
    return 'Merancang dan membangun sistem backend yang stabil, aman, dan siap diskalakan — dari API, arsitektur data, sampai proses deployment yang rapi.';
  }

  stackFocus(): string {
    const stackMatches = this.portfolio.skills
      .map((skill) => skill.title.trim())
      .filter((title) => STACK_KEYWORDS.some((keyword) => title.toLowerCase().includes(keyword)))
      .slice(0, 4);

    return stackMatches.length > 0 ? stackMatches.join(' • ') : 'Laravel • PHP • Golang • MySQL';
  }

  // Daftar teks yang di-marquee (scroll horizontal tanpa henti) di bawah hero — dari titel skill
  // asli, bukan hardcode, biar tetap representatif walau datanya beda-beda per user.
  marqueeItems(): string[] {
    const titles = this.portfolio.skills.map((skill) => skill.title).filter(Boolean);
    return titles.length > 0 ? titles : ['Backend Engineering', 'System Design', 'API Development'];
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

  normalizedAboutMe(): string {
    return (this.portfolio?.profile?.about_me || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/ /g, ' ');
  }

  topSkills(limit = 5): PublicSkill[] {
    return this.portfolio?.skills.slice(0, limit) ?? [];
  }

  formatPeriod(startDate: string, endDate: string | null): string {
    return formatPeriod(startDate, endDate);
  }

  // ---------- Skills ----------

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

  // ---------- Projects ----------

  trackByProjectId(_index: number, project: PublicTechnicalProject): number {
    return project.id;
  }

  projectTechStack(project: PublicTechnicalProject): string[] {
    return project.tech_stack
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }

  // Card di grid cuma nampilin chip tech stack yang beneran muat di 2 baris (diukur dari DOM,
  // lihat recomputeProjectTechOverflow) — daftar lengkapnya tetap kelihatan di modal "Show".
  projectCardTechStack(project: PublicTechnicalProject): string[] {
    return this.projectTechOverflow[project.id]?.visible ?? this.projectTechStack(project);
  }

  projectCardTechOverflowCount(project: PublicTechnicalProject): number {
    return this.projectTechOverflow[project.id]?.hiddenCount ?? 0;
  }

  openProjectModal(project: PublicTechnicalProject): void {
    this.selectedProject = project;
  }

  closeProjectModal(): void {
    this.selectedProject = null;
  }

  previewProjectFile(fileData: string): void {
    openFilePreview(fileData);
  }

  // ---------- Contact ----------

  contactActions(): ContactAction[] {
    const profile = this.portfolio.profile;
    if (!profile) {
      return [];
    }

    return [
      profile.email
        ? { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, icon: 'mail' }
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

  // ---------- Animated stat counters ----------

  private buildStatCounters(): void {
    const firstExperienceYear = this.portfolio.work_histories
      .map((item) => Number(item.start_date.slice(0, 4)))
      .filter((year) => !Number.isNaN(year))
      .sort((a, b) => a - b)[0];

    const yearsExperience =
      firstExperienceYear && firstExperienceYear <= this.currentYear
        ? Math.max(1, this.currentYear - firstExperienceYear)
        : 0;

    this.statCounters = [
      { label: 'Tahun Pengalaman', icon: 'briefcase', suffix: '+', target: yearsExperience, current: 0 },
      { label: 'Technical Project', icon: 'folder-kanban', suffix: '', target: this.portfolio.technical_projects.length, current: 0 },
      { label: 'Skill Dikuasai', icon: 'star', suffix: '', target: this.portfolio.skills.length, current: 0 },
      { label: 'Riwayat Pendidikan', icon: 'graduation-cap', suffix: '', target: this.portfolio.educations.length, current: 0 },
    ].filter((stat) => stat.target > 0);
  }

  // Animasi hitung naik dari 0 ke nilai asli, dipicu sekali begitu section statistik masuk
  // viewport (bukan langsung jalan di ngAfterViewInit, biar user beneran "melihat" hitungannya).
  private setupStatCounterObserver(): void {
    if (!this.statCounters.length) {
      return;
    }
    const el = this.host.nativeElement.querySelector('.stats-grid');
    if (!el) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.statObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !this.countersAnimated) {
            this.countersAnimated = true;
            this.animateCounters();
            this.statObserver?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      this.statObserver.observe(el);
    });
  }

  private animateCounters(): void {
    const duration = 1400;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.ngZone.run(() => {
        this.statCounters = this.statCounters.map((stat) => ({
          ...stat,
          current: Math.round(stat.target * eased),
        }));
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  // ---------- 3D tilt (hero card & project card) ----------

  // Efek miring ikut posisi kursor buat elemen ber-atribut [data-tilt], dijalanin di luar Angular
  // zone (mousemove nembak terus, gak perlu tiap frame-nya lewat change detection) dan nulis
  // langsung ke style.transform si elemen. Reset ke transform kosong pas mouse keluar.
  private setupTiltEffect(): void {
    const cards = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-tilt]');
    if (!cards.length) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      cards.forEach((card) => {
        const maxDeg = Number(card.dataset['tiltMax'] ?? 8);

        const handleMove = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(1000px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg) translateY(-6px)`;
        };
        const handleLeave = () => {
          card.style.transform = '';
        };

        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseleave', handleLeave);
        this.tiltCleanups.push(() => {
          card.removeEventListener('mousemove', handleMove);
          card.removeEventListener('mouseleave', handleLeave);
        });
      });
    });
  }

  // ---------- Scroll reveal (sama persis pola yang udah diperbaiki di landing-page-1) ----------

  private setupScrollReveal(): void {
    this.observer?.disconnect();

    const revealItems = this.host.nativeElement.querySelectorAll<HTMLElement>('.reveal-on-scroll');
    if (!revealItems.length) {
      return;
    }

    // Hysteresis band: dekorasi ambient (glow/orbit berputar) terus-menerus nggeser layout
    // sedikit. Ambang tunggal bikin itu doang udah cukup buat toggle terus — kasih jarak
    // aman antara "muncul" & "hilang" biar cuma scroll beneran yang nge-trigger.
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

  // ---------- Project tech stack overflow (sama pola dari landing-page-1) ----------

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
      const tops = chips.map((chip) => chip.offsetTop);
      const firstRowTop = tops[0];
      const secondRowTop = tops.find((top) => top > firstRowTop) ?? firstRowTop;
      let cutoff = tops.filter((top) => top <= secondRowTop).length;

      if (cutoff >= allTags.length) {
        nextState[projectId] = { visible: allTags, hiddenCount: 0 };
        return;
      }

      cutoff = Math.max(1, cutoff - 1);
      nextState[projectId] = {
        visible: allTags.slice(0, cutoff),
        hiddenCount: allTags.length - cutoff,
      };
    });

    this.projectTechOverflow = nextState;
  }
}
