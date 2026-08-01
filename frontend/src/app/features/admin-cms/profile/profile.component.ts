import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { LucideAngularModule } from 'lucide-angular';
import { ProfileService } from '../../../core/profile/profile.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ImageUploadComponent } from '../../../shared/ui/image-upload/image-upload.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { fieldError } from '../../../shared/utils/form-error.util';

// Halaman edit profil CMS, route /admin-cms/profile. Icon (Save) didaftarkan di main.ts.
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    ImageUploadComponent,
    QuillModule,
    LucideAngularModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  form: ReturnType<FormBuilder['group']>;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      full_name: ['', Validators.required],
      position: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      wa_number: ['', Validators.required],
      linkedin: [''],
      github: [''],
      city: [''],
      about_me: [''],
      image: [''],
    });
  }

  // Dipakai template buat nampilin pesan validation di bawah masing-masing field.
  fieldError(name: string): string {
    return fieldError(this.form, name, (control) =>
      control.errors?.['email'] ? 'Format email tidak valid.' : undefined,
    );
  }

  // Load profil user saat halaman dibuka, isi form (kosong kalau belum pernah diisi).
  ngOnInit(): void {
    this.profileService.get().subscribe({
      next: (profile) => this.form.patchValue(profile),
      error: () => this.toast.error('Gagal memuat profil.'),
    });
  }

  // Simpan perubahan (create otomatis kalau belum ada, update kalau sudah ada).
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.profileService.save(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Profil berhasil disimpan.');
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Gagal menyimpan profil.');
      },
    });
  }
}
