import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TechnicalProject, TechnicalProjectService } from './technical-project.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { FilesUploadComponent, UploadedFile } from '../../../shared/ui/files-upload/files-upload.component';
import {
  DataTableColumn,
  DataTableComponent,
  DataTableQuery,
} from '../../../shared/ui/data-table/data-table.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { fieldError } from '../../../shared/utils/form-error.util';
import { confirmAndDelete } from '../../../shared/utils/confirm-delete.util';
import { loadPagedList } from '../../../shared/utils/load-paged-list.util';

// Halaman CRUD technical project CMS, route /admin-cms/technical-projects.
@Component({
  selector: 'app-technical-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    FilesUploadComponent,
    LucideAngularModule,
    DataTableComponent,
  ],
  templateUrl: './technical-projects.component.html',
  styleUrl: './technical-projects.component.scss',
})
export class TechnicalProjectsComponent implements OnInit {
  // Template cell custom buat kolom Aksi, di-assign ke `columns` di ngOnInit
  // (static: true karena template ini gak di dalam *ngIf/*ngFor, jadi udah tersedia sebelum ngOnInit).
  @ViewChild('aksiTpl', { static: true }) aksiTpl!: TemplateRef<unknown>;

  projects: TechnicalProject[] = [];
  columns: DataTableColumn[] = [];
  // Total baris di BE (meta.total) — dikirim ke <app-data-table [totalCount]> buat hitung pager.
  totalCount = 0;
  // Ukuran halaman aktual yang dipakai BE (meta.per_page) — bisa beda dari default kalau BE
  // punya default sendiri, jadi pager di FE mesti ikut nilai ini, bukan asumsi sendiri.
  pageSize = 10;
  isModalOpen = false;
  isSaving = false;
  // null = mode create (tombol "Add"), terisi id = mode edit/lihat (row yang lagi dibuka).
  editingId: number | null = null;
  // true kalau modal dibuka dari tombol "Show" — form di-disable, cuma buat baca, gak bisa submit.
  isReadOnly = false;
  // Query search/sort terakhir dari <app-data-table>, disimpan biar loadProjects() abis
  // create/update/delete tetap pakai filter/sort yang lagi aktif (bukan reset ke default).
  private currentQuery: DataTableQuery = {};

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private technicalProjectService: TechnicalProjectService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      // Semua field wajib diisi kecuali files (nullable), samain sama minLength di BE.
      name_project: ['', [Validators.required, Validators.minLength(5)]],
      user_role: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      tech_stack: ['', [Validators.required, Validators.minLength(5)]],
      key_contributions: this.fb.array([this.fb.control('', Validators.required)]),
      // Files nullable & boleh lebih dari 1 — gak ada Validators, 0 file pun valid.
      files: this.fb.control<UploadedFile[]>([]),
    });
  }

  // Load daftar technical project begitu halaman dibuka + susun kolom tabel (pakai template cell custom).
  ngOnInit(): void {
    this.columns = [
      { name: 'Name Project', prop: 'name_project' },
      { name: 'Role', prop: 'user_role' },
      { name: 'Tech Stack', prop: 'tech_stack' },
      { name: 'Action', sortable: false, cellTemplate: this.aksiTpl },
    ];
    this.loadProjects();
  }

  // Getter pendek buat akses FormArray key contribution dari template
  // ([formArrayName]="key_contributions", key_contributions.controls, dst).
  get keyContributions(): FormArray {
    return this.form.get('key_contributions') as FormArray;
  }

  // Ambil ulang daftar technical project dari BE (pakai currentQuery), dipanggil saat init dan
  // tiap habis create/update/delete.
  loadProjects(): void {
    loadPagedList(
      this.technicalProjectService.list(this.currentQuery),
      this.toast,
      'Gagal memuat technical project.',
      (data, totalCount, pageSize) => {
        this.projects = data;
        this.totalCount = totalCount;
        this.pageSize = pageSize;
      },
    );
  }

  // Dipanggil dari (search) <app-data-table> tiap search box atau sort header berubah
  // (serverSide=true) — simpan query barunya, lalu fetch ulang dari BE.
  onTableQueryChange(query: DataTableQuery): void {
    this.currentQuery = query;
    this.loadProjects();
  }

  // Dipakai template buat nampilin pesan validation di bawah field top-level (bukan key contribution).
  // minLength opsional dikasih biar pesan minlength-nya sebut angka yang sesuai field ("Minimal N karakter."),
  // fallback ke fieldError bawaan ("Wajib diisi.") kalau errornya required.
  fieldError(name: string, minLength?: number): string {
    return fieldError(this.form, name, (control) =>
      control.errors?.['minlength'] ? `Minimal ${minLength} karakter.` : undefined,
    );
  }

  // Sama seperti fieldError, tapi buat tiap baris di FormArray key contribution.
  keyContributionError(index: number): string {
    const control = this.keyContributions.at(index);
    if (!control?.touched || !control.invalid) return '';
    return 'Wajib diisi.';
  }

  // Buka modal kosong buat nambah technical project baru (reset form + key contribution cuma
  // 1 baris kosong, files kosong).
  openCreateModal(): void {
    this.editingId = null;
    this.isReadOnly = false;
    this.form.enable();
    this.form.reset({
      name_project: '',
      user_role: '',
      description: '',
      tech_stack: '',
      files: [],
    });
    this.keyContributions.clear();
    this.keyContributions.push(this.fb.control('', Validators.required));
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing buat diedit; key contribution & files di-render ulang sesuai data.
  openEditModal(project: TechnicalProject): void {
    this.editingId = project.id;
    this.isReadOnly = false;
    this.form.enable();
    this.populateForm(project);
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing tapi read-only, cuma buat lihat detail (gak bisa diubah/submit).
  openShowModal(project: TechnicalProject): void {
    this.editingId = project.id;
    this.isReadOnly = true;
    this.form.enable();
    this.populateForm(project);
    this.form.disable();
    this.isModalOpen = true;
  }

  private populateForm(project: TechnicalProject): void {
    this.form.reset({
      name_project: project.name_project,
      user_role: project.user_role,
      description: project.description,
      tech_stack: project.tech_stack,
      files: project.files.map((f) => ({ file_name: f.file_name, file_data: f.file_data })),
    });
    this.keyContributions.clear();
    const contributions = project.key_contributions.length ? project.key_contributions : [''];
    contributions.forEach((c) => this.keyContributions.push(this.fb.control(c, Validators.required)));
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  addKeyContribution(): void {
    this.keyContributions.push(this.fb.control('', Validators.required));
  }

  // Minimal harus nyisa 1 baris key contribution di form, jadi gak bisa dihapus sampai kosong total.
  removeKeyContribution(index: number): void {
    if (this.keyContributions.length <= 1) return;
    this.keyContributions.removeAt(index);
  }

  // Submit create/update. Mode ditentukan dari editingId (null = create, terisi = update).
  submit(): void {
    if (this.form.invalid) {
      // markAllAsTouched nyentuh semua control termasuk yang di dalam FormArray key contribution,
      // jadi semua pesan error field langsung muncul begitu user coba submit.
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name_project: raw.name_project ?? '',
      user_role: raw.user_role ?? '',
      description: raw.description ?? '',
      tech_stack: raw.tech_stack ?? '',
      // Buang baris key contribution yang kosong/cuma spasi, biar gak ngirim string kosong ke BE.
      key_contributions: ((raw.key_contributions ?? []) as string[]).filter(
        (c) => !!c && c.trim() !== '',
      ),
      files: (raw.files ?? []) as UploadedFile[],
    };

    this.isSaving = true;
    const request = this.editingId
      ? this.technicalProjectService.update(this.editingId, payload)
      : this.technicalProjectService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Technical project berhasil disimpan.');
        this.closeModal();
        this.loadProjects();
      },
      error: (err) => {
        this.isSaving = false;
        // BE balikin pesan validasi sebagai plain text (bukan JSON) di body 400 — tampilkan
        // langsung ke user kalau ada, fallback ke pesan generik buat error lain.
        const message =
          typeof err?.error === 'string' && err.error
            ? err.error
            : 'Gagal menyimpan technical project.';
        this.toast.error(message);
      },
    });
  }

  // Hapus technical project setelah konfirmasi.
  remove(project: TechnicalProject): void {
    confirmAndDelete(
      `Hapus technical project "${project.name_project}"?`,
      () => this.technicalProjectService.delete(project.id),
      this.toast,
      'Technical project dihapus.',
      'Gagal menghapus technical project.',
      () => this.loadProjects(),
    );
  }
}
