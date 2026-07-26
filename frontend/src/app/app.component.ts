import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Shell aplikasi: cuma render route aktif, semua konten ada di masing-masing feature component.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {}
