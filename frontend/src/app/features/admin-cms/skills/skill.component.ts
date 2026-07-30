import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { Skill, SkillPayload, SkillService } from './skill.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import {
  DataTableColumn,
  DataTableComponent,
  DataTableQuery,
} from '../../../shared/ui/data-table/data-table.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { fieldError } from '../../../shared/utils/form-error.util';
import { confirmAndDelete } from '../../../shared/utils/confirm-delete.util';
import { loadPagedList } from '../../../shared/utils/load-paged-list.util';

// Label tampilan buat tiap kategori skill (value asli yang dikirim ke BE tetap snake_case).
const SKILL_TYPE_LABELS: Record<string, string> = {
  soft_skill: 'Soft Skill',
  hard_skill: 'Hard Skill',
  software_skill: 'Software Skill',
};

// Halaman CRUD skill CMS, route /admin-cms/skills. Create mendukung multiple baris sekaligus
// (tombol "+ Add Row"), tapi Edit cuma satu baris per submit (sesuai desain modal & API BE).
@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    LucideAngularModule,
    DataTableComponent,
  ],
  templateUrl: './skill.component.html',
  styleUrl: './skill.component.scss',
})
export class SkillComponent implements OnInit {
  @ViewChild('typeTpl', { static: true }) typeTpl!: TemplateRef<unknown>;
  @ViewChild('aksiTpl', { static: true }) aksiTpl!: TemplateRef<unknown>;

  skills: Skill[] = [];
  columns: DataTableColumn[] = [];
  totalCount = 0;
  pageSize = 10;
  isModalOpen = false;
  isSaving = false;
  // null = mode create (bisa multiple row), terisi id = mode edit/lihat (satu baris aja).
  editingId: number | null = null;
  isReadOnly = false;
  private currentQuery: DataTableQuery = {};

  skillTypeLabels = SKILL_TYPE_LABELS;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private skillService: SkillService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      rows: this.fb.array([this.newRow()]),
    });
  }

  ngOnInit(): void {
    this.columns = [
      { name: 'Title', prop: 'title' },
      { name: 'Type', prop: 'type', cellTemplate: this.typeTpl },
      { name: 'Action', sortable: false, cellTemplate: this.aksiTpl },
    ];
    this.loadSkills();
  }

  get rows(): FormArray {
    return this.form.get('rows') as FormArray;
  }

  private newRow() {
    return this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
    });
  }

  loadSkills(): void {
    loadPagedList(
      this.skillService.list(this.currentQuery),
      this.toast,
      'Gagal memuat skill.',
      (data, totalCount, pageSize) => {
        this.skills = data;
        this.totalCount = totalCount;
        this.pageSize = pageSize;
      },
    );
  }

  onTableQueryChange(query: DataTableQuery): void {
    this.currentQuery = query;
    this.loadSkills();
  }

  skillTypeLabel(type: string): string {
    return this.skillTypeLabels[type] ?? type;
  }

  fieldError(index: number, name: string): string {
    return fieldError(this.rows.at(index) as ReturnType<FormBuilder['group']>, name);
  }

  // Buka modal kosong buat nambah skill baru — bisa multiple baris (mulai dari 1 baris kosong).
  openCreateModal(): void {
    this.editingId = null;
    this.isReadOnly = false;
    this.form.enable();
    this.rows.clear();
    this.rows.push(this.newRow());
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing buat diedit — cuma satu baris, tombol "+ Add Row" disembunyikan.
  openEditModal(skill: Skill): void {
    this.editingId = skill.id;
    this.isReadOnly = false;
    this.form.enable();
    this.populateSingleRow(skill);
    this.isModalOpen = true;
  }

  openShowModal(skill: Skill): void {
    this.editingId = skill.id;
    this.isReadOnly = true;
    this.form.enable();
    this.populateSingleRow(skill);
    this.form.disable();
    this.isModalOpen = true;
  }

  private populateSingleRow(skill: Skill): void {
    this.rows.clear();
    this.rows.push(this.fb.group({
      title: [skill.title, Validators.required],
      type: [skill.type, Validators.required],
    }));
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // Multiple baris cuma didukung pas create (editingId null) — tombol ini disembunyikan di edit/show.
  addRow(): void {
    this.rows.push(this.newRow());
  }

  // Minimal harus nyisa 1 baris di form, jadi gak bisa dihapus sampai kosong total.
  removeRow(index: number): void {
    if (this.rows.length <= 1) return;
    this.rows.removeAt(index);
  }

  // Submit create (loop semua baris, satu request per baris) atau update (satu baris aja).
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rowsValue = this.rows.getRawValue() as SkillPayload[];
    this.isSaving = true;

    if (this.editingId) {
      this.skillService.update(this.editingId, rowsValue[0]).subscribe({
        next: () => {
          this.isSaving = false;
          this.toast.success('Skill berhasil disimpan.');
          this.closeModal();
          this.loadSkills();
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.error(this.extractErrorMessage(err, 'Gagal menyimpan skill.'));
        },
      });
      return;
    }

    // Create multiple baris: kirim satu-satu (concatMap) biar urut & gampang dilacak baris mana
    // yang gagal (ex: title dobel), bukan langsung paralel semua.
    from(rowsValue)
      .pipe(
        concatMap((payload) =>
          this.skillService.create(payload).pipe(
            map(() => ({ ok: true as const, payload })),
            catchError((err) => of({ ok: false as const, payload, err })),
          ),
        ),
        toArray(),
      )
      .subscribe((results) => {
        this.isSaving = false;
        const failed = results.filter((r) => !r.ok);
        const savedCount = results.length - failed.length;

        if (failed.length === 0) {
          this.toast.success(
            savedCount > 1 ? `${savedCount} skill berhasil disimpan.` : 'Skill berhasil disimpan.',
          );
          this.closeModal();
        } else {
          const detail = failed
            .map((f) => `"${f.payload.title}": ${this.extractErrorMessage(f.err, 'gagal disimpan')}`)
            .join(' | ');
          this.toast.error(`${savedCount}/${results.length} skill tersimpan. ${detail}`);
        }
        this.loadSkills();
      });
  }

  remove(skill: Skill): void {
    confirmAndDelete(
      `Hapus skill "${skill.title}"?`,
      () => this.skillService.delete(skill.id),
      this.toast,
      'Skill dihapus.',
      'Gagal menghapus skill.',
      () => this.loadSkills(),
    );
  }

  // BE balikin pesan uniqueness/validasi sebagai plain text (bukan JSON) di body 400/409 —
  // tampilkan langsung ke user kalau ada, fallback ke pesan generik buat error lain.
  private extractErrorMessage(err: unknown, fallback: string): string {
    const httpError = err as { error?: unknown };
    return typeof httpError?.error === 'string' && httpError.error ? httpError.error : fallback;
  }
}
