import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

// Modal global reusable, dipakai form CRUD manapun lewat <app-modal [open]="..." (closed)="...">.
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  // Dipanggil dari klik backdrop atau tombol X; parent yang nentuin set open=false lewat (closed).
  close(): void {
    this.closed.emit();
  }
}
