import { Component, Input, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../toast/toast.service';
import { ButtonComponent } from '../button/button.component';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export interface UploadedFile {
  file_name: string;
  file_data: string; // base64 data URI
}

// Upload lampiran multi-file (nullable, 0..n), dipakai form manapun lewat formControlName.
// Beda dari app-image-upload (satu gambar), komponen ini nerima banyak file jenis apa pun
// sekaligus, ditambahkan ke list (bukan replace), value-nya array UploadedFile — dikirim apa
// adanya ke BE, disimpan per baris di tabel anak (base64 data URI, sama seperti user_profiles.image).
@Component({
  selector: 'app-files-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  templateUrl: './files-upload.component.html',
  styleUrl: './files-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilesUploadComponent),
      multi: true,
    },
  ],
})
export class FilesUploadComponent implements ControlValueAccessor {
  @Input() label = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  value: UploadedFile[] = [];
  disabled = false;

  private onChange: (value: UploadedFile[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private toast: ToastService) {}

  // Buka file di tab baru buat preview. Sengaja gak pakai <a href="data:...target="_blank">
  // langsung — browser modern (Chrome dkk) block navigasi tab baru ke data: URI dari klik link
  // (dianggap potensi phishing vector), linknya keliatan gak ngapa-ngapain pas diklik.
  // Solusinya: convert data URI ke Blob URL (blob:...) dulu, itu gak kena blokir yang sama.
  preview(file: UploadedFile): void {
    const blobUrl = this.toBlobUrl(file.file_data);
    const opened = window.open(blobUrl, '_blank');
    if (!opened) {
      this.toast.error('Gagal membuka preview file (popup diblokir browser?).');
    }
    // Kasih jeda sebelum revoke, biar tab baru sempat kelar loading konten sebelum blob-nya invalid.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  private toBlobUrl(dataUri: string): string {
    const [header, base64] = dataUri.split(',');
    const mimeMatch = header.match(/data:(.*);base64/);
    const mime = mimeMatch?.[1] || 'application/octet-stream';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  // Dipanggil Angular forms saat set value dari luar (ex: patchValue pas load data existing).
  writeValue(value: UploadedFile[] | null): void {
    this.value = value ?? [];
  }

  // Daftarin callback yang dipanggil handleFilesSelected/remove tiap value berubah.
  registerOnChange(fn: (value: UploadedFile[]) => void): void {
    this.onChange = fn;
  }

  // Daftarin callback yang dipanggil buat nandain field udah "disentuh" (dipakai validasi touched).
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Dipanggil Angular forms saat FormControl di-disable/enable (ex: mode read-only).
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Buka file picker native saat tombol "Add File" diklik.
  triggerFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  // Baca semua file yang dipilih (bisa lebih dari 1 sekaligus) jadi base64, ditambahkan ke list
  // yang sudah ada (bukan replace) — biar user bisa upload bertahap dari beberapa kali klik.
  handleFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        this.toast.error(`File "${file.name}" melebihi ukuran maksimal 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.value = [...this.value, { file_name: file.name, file_data: reader.result as string }];
        this.onChange(this.value);
        this.onTouched();
      };
      reader.readAsDataURL(file);
    });

    // Reset value input, biar pilih file yang sama persis dua kali berturut-turut tetap
    // memicu event (change) — tanpa ini browser gak fire change kalau selection-nya identik.
    input.value = '';
  }

  // Hapus satu file dari list berdasarkan index.
  remove(index: number): void {
    this.value = this.value.filter((_, i) => i !== index);
    this.onChange(this.value);
    this.onTouched();
  }
}
