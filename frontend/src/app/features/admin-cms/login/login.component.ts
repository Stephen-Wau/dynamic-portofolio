import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Halaman login CMS, route /admin-cms/login. Icon (LogIn) didaftarkan di main.ts.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: ReturnType<FormBuilder['group']>;
  isSubmitting = false;
  credentialsInvalid = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  // Dipakai template buat nampilin pesan validation di bawah masing-masing field.
  fieldError(name: string): string {
    const control = this.form.get(name);
    if (!control?.touched || !control.invalid) return '';
    return `${name === 'username' ? 'Username' : 'Password'} wajib diisi.`;
  }

  // Submit form login, redirect ke dashboard CMS kalau sukses.
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.credentialsInvalid = false;
    const { username, password } = this.form.getRawValue();

    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Login berhasil.');
        this.router.navigate(['/admin-cms']);
      },
      error: () => {
        this.isSubmitting = false;
        this.credentialsInvalid = true;
        this.toast.error('Username atau password salah.');
      },
    });
  }
}
