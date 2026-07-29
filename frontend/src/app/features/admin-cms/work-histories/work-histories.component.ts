import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { WorkHistory, WorkHistoryService } from './work-history.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import {
  DataTableColumn,
  DataTableComponent,
  DataTableQuery,
} from '../../../shared/ui/data-table/data-table.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Label bulan Indonesia dipakai formatMonth(), index 0 = Januari.
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

// Halaman CRUD riwayat kerja CMS, route /admin-cms/work-histories.
@Component({
  selector: 'app-work-histories',
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
  templateUrl: './work-histories.component.html',
  styleUrl: './work-histories.component.scss',
})
export class WorkHistoriesComponent implements OnInit {
  // Template cell custom buat kolom Periode & Aksi, di-assign ke `columns` di ngOnInit
  // (static: true karena template ini gak di dalam *ngIf/*ngFor, jadi udah tersedia sebelum ngOnInit).
  @ViewChild('periodeTpl', { static: true }) periodeTpl!: TemplateRef<unknown>;
  @ViewChild('aksiTpl', { static: true }) aksiTpl!: TemplateRef<unknown>;

  histories: WorkHistory[] = [];
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
  // Query search/sort terakhir dari <app-data-table>, disimpan biar loadHistories() abis
  // create/update/delete tetap pakai filter/sort yang lagi aktif (bukan reset ke default).
  private currentQuery: DataTableQuery = {};

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private workHistoryService: WorkHistoryService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      company_name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      // Checkbox "Masih bekerja di sini" — kalau true, end_date di-null-kan saat submit,
      // field-nya disembunyikan di template, dan Validators.required-nya dilepas (lihat di bawah).
      stillWorking: [false],
      points: this.fb.array([this.fb.control('', Validators.required)]),
    });

    // end_date cuma wajib diisi kalau "Masih bekerja di sini" TIDAK dicentang.
    this.form.get('stillWorking')!.valueChanges.subscribe((stillWorking) => {
      const endDate = this.form.get('end_date')!;
      if (stillWorking) {
        endDate.clearValidators();
        endDate.setValue('');
      } else {
        endDate.setValidators(Validators.required);
      }
      endDate.updateValueAndValidity();
    });
  }

  // Load daftar riwayat kerja begitu halaman dibuka + susun kolom tabel (pakai template cell custom).
  ngOnInit(): void {
    this.columns = [
      { name: 'Company', prop: 'company_name' },
      // prop: 'start_date' dipasang biar sort jalan (ngx-datatable sort berdasarkan prop, bukan
      // hasil render cellTemplate), meskipun yang ditampilin tetap format "Periode" custom.
      { name: 'Period', prop: 'start_date', cellTemplate: this.periodeTpl },
      { name: 'Action', sortable: false, cellTemplate: this.aksiTpl },
    ];
    this.loadHistories();
  }

  // Getter pendek buat akses FormArray poin dari template ([formArrayName]="points", points.controls, dst).
  get points(): FormArray {
    return this.form.get('points') as FormArray;
  }

  // Ambil ulang daftar riwayat kerja dari BE (pakai currentQuery), dipanggil saat init dan
  // tiap habis create/update/delete.
  loadHistories(): void {
    this.workHistoryService.list(this.currentQuery).subscribe({
      next: ({ data, meta }) => {
        this.histories = data;
        this.totalCount = meta.total;
        this.pageSize = meta.per_page;
      },
      error: () => this.toast.error('Gagal memuat riwayat kerja.'),
    });
  }

  // Dipanggil dari (search) <app-data-table> tiap search box atau sort header berubah
  // (serverSide=true) — simpan query barunya, lalu fetch ulang dari BE.
  onTableQueryChange(query: DataTableQuery): void {
    this.currentQuery = query;
    this.loadHistories();
  }

  // Format "YYYY-MM" jadi "Agu 2025", atau "Sekarang" kalau null (masih bekerja di sana).
  formatPeriod(history: WorkHistory): string {
    const start = this.formatMonth(history.start_date);
    const end = history.end_date ? this.formatMonth(history.end_date) : 'Sekarang';
    return `${start} – ${end}`;
  }

  private formatMonth(yyyymm: string): string {
    const [year, month] = yyyymm.split('-').map(Number);
    return `${MONTH_LABELS[month - 1]} ${year}`;
  }

  // Dipakai template buat nampilin pesan validation di bawah field top-level (bukan poin).
  fieldError(name: string): string {
    const control = this.form.get(name);
    if (!control?.touched || !control.invalid) return '';
    return 'Wajib diisi.';
  }

  // Sama seperti fieldError, tapi buat tiap baris di FormArray poin.
  pointError(index: number): string {
    const control = this.points.at(index);
    if (!control?.touched || !control.invalid) return '';
    return 'Wajib diisi.';
  }

  // Buka modal kosong buat nambah riwayat kerja baru (reset form + poin cuma 1 baris kosong).
  openCreateModal(): void {
    this.editingId = null;
    this.isReadOnly = false;
    this.form.enable();
    this.form.reset({ company_name: '', start_date: '', end_date: '', stillWorking: false });
    this.points.clear();
    this.points.push(this.fb.control('', Validators.required));
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing buat diedit; poin di-render ulang jadi FormArray sesuai data.
  openEditModal(history: WorkHistory): void {
    this.editingId = history.id;
    this.isReadOnly = false;
    this.form.enable();
    this.populateForm(history);
    this.isModalOpen = true;
  }

  // Buka modal terisi data existing tapi read-only, cuma buat lihat detail (gak bisa diubah/submit).
  openShowModal(history: WorkHistory): void {
    this.editingId = history.id;
    this.isReadOnly = true;
    this.form.enable();
    this.populateForm(history);
    this.form.disable();
    this.isModalOpen = true;
  }

  private populateForm(history: WorkHistory): void {
    this.form.reset({
      company_name: history.company_name,
      start_date: history.start_date,
      end_date: history.end_date ?? '',
      stillWorking: history.end_date === null,
    });
    this.points.clear();
    const points = history.points.length ? history.points : [''];
    points.forEach((p) => this.points.push(this.fb.control(p, Validators.required)));
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  addPoint(): void {
    this.points.push(this.fb.control('', Validators.required));
  }

  // Minimal harus nyisa 1 baris poin di form, jadi gak bisa dihapus sampai kosong total.
  removePoint(index: number): void {
    if (this.points.length <= 1) return;
    this.points.removeAt(index);
  }

  // Submit create/update. Mode ditentukan dari editingId (null = create, terisi = update).
  submit(): void {
    if (this.form.invalid) {
      // markAllAsTouched nyentuh semua control termasuk yang di dalam FormArray poin,
      // jadi semua pesan error field langsung muncul begitu user coba submit.
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      company_name: raw.company_name!,
      start_date: raw.start_date!,
      // stillWorking dicentang → paksa end_date null, abaikan apa pun yang keisi di field-nya.
      end_date: raw.stillWorking ? null : raw.end_date || null,
      // Buang baris poin yang kosong/cuma spasi, biar gak ngirim poin kosong ke BE.
      points: ((raw.points ?? []) as string[]).filter((p) => !!p && p.trim() !== ''),
    };

    // Perbandingan string valid buat format "YYYY-MM" (zero-padded) — samain sama pengecekan di BE.
    if (payload.end_date && payload.start_date > payload.end_date) {
      this.toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    this.isSaving = true;
    const request = this.editingId
      ? this.workHistoryService.update(this.editingId, payload)
      : this.workHistoryService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Riwayat kerja berhasil disimpan.');
        this.closeModal();
        this.loadHistories();
      },
      error: (err) => {
        this.isSaving = false;
        // BE balikin pesan overlap sebagai plain text (bukan JSON) di body 409 — tampilkan
        // langsung ke user kalau ada, fallback ke pesan generik buat error lain.
        const message =
          typeof err?.error === 'string' && err.error
            ? err.error
            : 'Gagal menyimpan riwayat kerja.';
        this.toast.error(message);
      },
    });
  }

  // Hapus riwayat kerja setelah konfirmasi native browser (window.confirm — cukup buat aksi
  // destruktif sederhana ini, gak perlu component confirm dialog terpisah).
  remove(history: WorkHistory): void {
    if (!window.confirm(`Hapus riwayat kerja di "${history.company_name}"?`)) return;

    this.workHistoryService.delete(history.id).subscribe({
      next: () => {
        this.toast.success('Riwayat kerja dihapus.');
        this.loadHistories();
      },
      error: () => this.toast.error('Gagal menghapus riwayat kerja.'),
    });
  }
}
