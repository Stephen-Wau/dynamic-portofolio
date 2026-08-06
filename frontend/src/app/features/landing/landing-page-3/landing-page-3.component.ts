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
  ViewChild,
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

type TabId = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'education' | 'contact';

interface NavTab {
  id: TabId;
  label: string;
  icon: string;
}

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
  'laravel', 'php', 'golang', 'go', 'mysql', 'postgresql', 'postgres',
  'redis', 'docker', 'nginx', 'linux', 'git', 'rest api', 'api',
];

const ALL_TABS: NavTab[] = [
  { id: 'home', label: 'Home', icon: 'layout-dashboard' },
  { id: 'about', label: 'About', icon: 'user' },
  { id: 'skills', label: 'Skills', icon: 'star' },
  { id: 'projects', label: 'Projects', icon: 'folder-kanban' },
  { id: 'experience', label: 'Experience', icon: 'briefcase' },
  { id: 'education', label: 'Education', icon: 'graduation-cap' },
  { id: 'contact', label: 'Contact', icon: 'mail' },
];

// Landing page 3: bukan halaman scroll panjang seperti page 1/2 — nav di-klik langsung ganti
// "layar" konten (kayak app dashboard), dengan animasi slide/fade tiap pindah tab, plus Lottie
// ringan (hand-authored JSON, lihat assets/lottie/server-pulse.json) buat aksen "server pulse"
// di tab Home. Tema biru cerah, tetap dalam nuansa backend engineering (SSH/terminal, server,
// database, network node).
@Component({
  selector: 'app-landing-page-3',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './landing-page-3.component.html',
  styleUrl: './landing-page-3.component.scss',
})
export class LandingPage3Component implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) portfolio!: PublicPortfolio;
  @ViewChild('lottieHost') lottieHostRef?: ElementRef<HTMLDivElement>;

  currentYear = new Date().getFullYear();
  navTabs = ALL_TABS;
  activeTab: TabId = 'home';
  direction: 'forward' | 'backward' = 'forward';
  selectedProject: PublicTechnicalProject | null = null;
  statCounters: StatCounter[] = [];

  private lottieAnim: { destroy: () => void } | null = null;
  private tiltCleanups: Array<() => void> = [];
  private techOverflowResizeObserver: ResizeObserver | null = null;
  private cachedSkillGroups: SkillGroup[] | null = null;
  private cachedSkillGroupsSource: PublicSkill[] | null = null;
  private projectTechOverflow: Record<number, { visible: string[]; hiddenCount: number }> = {};

  constructor(
    private host: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    this.buildStatCounters();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Defer ke macrotask baru biar gak nulis DOM-dependent state di siklus CD yang sama
    // (pola yang sama kayak landing-page-1/2, hindari ExpressionChangedAfterItHasBeenCheckedError).
    setTimeout(() => this.onTabContentReady());

    this.ngZone.runOutsideAngular(() => {
      this.techOverflowResizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.recomputeProjectTechOverflow());
      });
      this.techOverflowResizeObserver.observe(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.techOverflowResizeObserver?.disconnect();
    this.tiltCleanups.forEach((cleanup) => cleanup());
    this.tiltCleanups = [];
    this.lottieAnim?.destroy();
  }

  // ---------- Tab switching ----------

  switchTab(tab: TabId): void {
    if (tab === this.activeTab) {
      return;
    }
    const currentIndex = this.navTabs.findIndex((t) => t.id === this.activeTab);
    const nextIndex = this.navTabs.findIndex((t) => t.id === tab);
    this.direction = nextIndex > currentIndex ? 'forward' : 'backward';
    this.activeTab = tab;

    // Konten tab baru baru bener-bener ke-render abis CD berikutnya — tunda setup DOM-dependent
    // (tilt, ukur overflow tech stack, re-init Lottie) ke situ.
    setTimeout(() => this.onTabContentReady());
  }

  private onTabContentReady(): void {
    this.setupTiltEffect();
    if (this.activeTab === 'projects') {
      this.recomputeProjectTechOverflow();
    }
    if (this.activeTab === 'home') {
      this.setupLottie();
    }
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
    return 'Merancang dan menjalankan sistem backend yang stabil, aman, dan siap discale — dari API, arsitektur data, sampai proses deployment yang rapi.';
  }

  stackFocus(): string {
    const stackMatches = this.portfolio.skills
      .map((skill) => skill.title.trim())
      .filter((title) => STACK_KEYWORDS.some((keyword) => title.toLowerCase().includes(keyword)))
      .slice(0, 4);
    return stackMatches.length > 0 ? stackMatches.join(' • ') : 'Laravel • PHP • Golang • MySQL';
  }

  latestExperienceCompany(): string | null {
    return this.portfolio?.work_histories[0]?.company_name ?? null;
  }

  normalizedAboutMe(): string {
    return (this.portfolio?.profile?.about_me || '').replace(/&nbsp;/gi, ' ').replace(/ /g, ' ');
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

    if (isPlatformBrowser(this.platformId) && this.statCounters.length) {
      // Home adalah tab default, jadi statistik-nya langsung dihitung naik begitu halaman dibuka
      // (gak perlu nunggu di-scroll ke viewport kayak lp1/lp2, karena di sini semuanya "di layar").
      setTimeout(() => this.animateCounters());
    }
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

  // ---------- Lottie (server pulse, tab Home) ----------

  private setupLottie(): void {
    const container = this.lottieHostRef?.nativeElement;
    if (!container) {
      return;
    }

    this.lottieAnim?.destroy();
    this.lottieAnim = null;

    this.ngZone.runOutsideAngular(() => {
      import('lottie-web').then((lottieModule) => {
        const lottie = lottieModule.default;
        this.lottieAnim = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: 'assets/lottie/server-pulse.json',
        });
      });
    });
  }

  // ---------- 3D tilt (hero card & project card) ----------

  private setupTiltEffect(): void {
    const cards = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-tilt]');
    this.tiltCleanups.forEach((cleanup) => cleanup());
    this.tiltCleanups = [];
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

  // ---------- Project tech stack overflow ----------

  private recomputeProjectTechOverflow(): void {
    const measureRows = this.host.nativeElement.querySelectorAll<HTMLElement>(
      '.project-card__tags--measure',
    );
    if (!measureRows.length) {
      return;
    }
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
