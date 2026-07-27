import { Component, ElementRef, Input, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../toast/toast.service';
import { ButtonComponent } from '../button/button.component';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

// Upload gambar global dengan preview, dipakai form manapun lewat formControlName.
// Value-nya string base64 data URI (dikirim apa adanya ke BE, disimpan di kolom DB).
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
})
export class ImageUploadComponent implements ControlValueAccessor {
  @Input() label = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  value: string | null = null;
  disabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private toast: ToastService) {}

  writeValue(value: string | null): void {
    this.value = value || null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Buka file picker native saat area preview/tombol diklik.
  triggerFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  // Baca file terpilih jadi base64, langsung update preview begitu selesai.
  handleFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('File harus berupa gambar.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toast.error('Ukuran gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.value = reader.result as string;
      this.onChange(this.value);
      this.onTouched();
    };
    reader.readAsDataURL(file);
  }

  remove(): void {
    this.value = null;
    this.onChange(null);
    this.onTouched();
  }
}
