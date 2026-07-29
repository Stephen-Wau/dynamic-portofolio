import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Education, EducationService } from './education.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import {
  DataTableColumn,
  DataTableComponent,
  DataTableQuery,
} from '../../../shared/ui/data-table/data-table.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { formatPeriod } from '../../../shared/utils/month-format.util';
import { fieldError } from '../../../shared/utils/form-error.util';
import { toggleOptionalEndDate } from '../../../shared/utils/optional-end-date.util';
import { confirmAndDelete } from '../../../shared/utils/confirm-delete.util';
import { loadPagedList } from '../../../shared/utils/load-paged-list.util';

// Halaman CRUD riwayat pendidikan CMS, route /admin-cms/education.
@Component({
  selector: 'app-education',
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
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
})
export class EducationComponent implements OnInit {
  // Template cell custom buat kolom Periode & Aksi, di-assign ke `columns` di ngOnInit
  // (static: true karena template ini gak di dalam *ngIf/*ngFor, jadi udah tersedia sebelum ngOnInit).
  @ViewChild('periodeTpl', { static: true }) periodeTpl!: TemplateRef<unknown>;
  @ViewChild('aksiTpl', { static: true }) aksiTpl!: TemplateRef<unknown>;

  educations: Education[] = [];
  columns: DataTableColumn[] = [];
  // Total baris di BE (meta.total) — dikirim ke <app-data-table [totalCount]> buat hitung pager.
  totalCount = 0;
  // Ukuran halaman aktual yang dipakai BE (meta.per_page) — bisa beda dari default kalau BE
  // punya default sendiri, jadi pager di FE mesti ikut nilai ini, bukan asumsi sendiri.
  pageSize = 10;
  isModalOpen = false;
  isSaving = false;
  // null = mode create (tombol "Tambah"), terisi id = mode edit/lihat (row yang lagi dibuka).
  editingId: number | null = null;
  // true kalau modal dibuka dari tombol "Lihat" — form di-disable, cuma buat baca, gak bisa submit.
  isReadOnly = false;
  // Query search/sort terakhir dari <app-data-table>, disimpan biar loadEducations() abis
  // create/update/delete tetap pakai filter/sort yang lagi aktif (bukan reset ke default).
  private currentQuery: DataTableQuery = {};

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      place: ['', Validators.required],
      major: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      // Checkbox "Masih menempuh pendidikan ini" — kalau true, end_date di-null-kan saat submit,
      // field-nya disembunyikan di template, dan Validators.required-nya dilepas (lihat di bawah).
      stillStudying: [false],
    });

    // end_date cuma wajib diisi kalau "Masih menempuh pendidikan ini" TIDAK dicentang.
    toggleOptionalEndDate(this.form, 'stillStudying', 'end_date');
  }

  // Load daftar riwayat pendidikan begitu halaman dibuka + susun kolom tabel (pakai template cell custom).
  ngOnInit(): void {
    this.columns = [
      { name: 'Place', prop: 'place' },
      { name: 'Major', prop: 'major' },
      // prop: 'start_date' dipasang biar sort jalan (ngx-datatable sort berdasarkan prop, bukan
      // hasil render cellTemplate), meskipun yang ditampilin tetap format "Periode" custom.
      { name: 'Period', prop: 'start_date', cellTemplate: this.periodeTpl },
      { name: 'Action', sortable: false, cellTemplate: this.aksiTpl },
    ];
    this.loadEducations();
  }

  // Ambil ulang daftar riwayat pendidikan dari BE (pakai currentQuery), dipanggil saat init dan
  // tiap habis create/update/delete.
  loadEducations(): void {
    loadPagedList(
      this.educationService.list(this.currentQuery),
      this.toast,
      'Gagal memuat riwayat pendidikan.',
      (data, totalCount, pageSize) => {
        this.educations = data;
        this.totalCount = totalCount;
        this.pageSize = pageSize;
      },
    );
  }

  // Dipanggil dari (search) <app-data-table> tiap search box atau sort header berubah
  // (serverSide=true) — simpan query barunya, lalu fetch ulang dari BE.
  onTableQueryChange(query: DataTableQuery): void {
    this.currentQuery = query;
    this.loadEducations();
  }

  // Format "YYYY-MM" jadi "Agu 2025", atau "Sekarang" kalau null (masih menempuh pendidikan itu).
  formatPeriod(education: Education): string {
    return formatPeriod(education.start_date, education.end_date);
  }

  // Dipakai template buat nampilin pesan validation di bawah field.
  fieldError(name: string): string {
    return fieldError(this.form, name);
  }

  // Buka modal kosong buat nambah riwayat pendidikan baru.
  openCreateModal(): void {
    this.editingId = null;
    this.isReadOnly = false;
    this.form.enable();
    this.form.reset({ place: '', major: '', start_date: '', end_date: '', stillStudying: false });
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing buat diedit.
  openEditModal(education: Education): void {
    this.editingId = education.id;
    this.isReadOnly = false;
    this.form.enable();
    this.populateForm(education);
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing tapi read-only, cuma buat lihat detail (gak bisa diubah/submit).
  openShowModal(education: Education): void {
    this.editingId = education.id;
    this.isReadOnly = true;
    this.form.enable();
    this.populateForm(education);
    this.form.disable();
    this.isModalOpen = true;
  }

  private populateForm(education: Education): void {
    this.form.reset({
      place: education.place,
      major: education.major,
      start_date: education.start_date,
      end_date: education.end_date ?? '',
      stillStudying: education.end_date === null,
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // Submit create/update. Mode ditentukan dari editingId (null = create, terisi = update).
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      place: raw.place!,
      major: raw.major!,
      start_date: raw.start_date!,
      // stillStudying dicentang → paksa end_date null, abaikan apa pun yang keisi di field-nya.
      end_date: raw.stillStudying ? null : raw.end_date || null,
    };

    // Perbandingan string valid buat format "YYYY-MM" (zero-padded) — samain sama pengecekan di BE.
    if (payload.end_date && payload.start_date > payload.end_date) {
      this.toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    this.isSaving = true;
    const request = this.editingId
      ? this.educationService.update(this.editingId, payload)
      : this.educationService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Riwayat pendidikan berhasil disimpan.');
        this.closeModal();
        this.loadEducations();
      },
      error: (err) => {
        this.isSaving = false;
        const message =
          typeof err?.error === 'string' && err.error
            ? err.error
            : 'Gagal menyimpan riwayat pendidikan.';
        this.toast.error(message);
      },
    });
  }

  // Hapus riwayat pendidikan setelah konfirmasi.
  remove(education: Education): void {
    confirmAndDelete(
      `Hapus riwayat pendidikan di "${education.place}"?`,
      () => this.educationService.delete(education.id),
      this.toast,
      'Riwayat pendidikan dihapus.',
      'Gagal menghapus riwayat pendidikan.',
      () => this.loadEducations(),
    );
  }
}
