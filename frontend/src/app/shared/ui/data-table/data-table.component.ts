import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

// Definisi 1 kolom: `prop` buat nampilin value langsung, atau `cellTemplate` buat cell custom
// (ex: format tanggal, tombol aksi). Kalau keduanya diisi, cellTemplate yang menang.
export interface DataTableColumn {
  name: string;
  prop?: string;
  sortable?: boolean;
  cellTemplate?: TemplateRef<unknown>;
}

// Tabel global reusable, dipakai semua menu CMS yang butuh list data lewat <app-data-table>.
// Bungkus ngx-datatable + styling standar, tiap menu tinggal kasih rows/columns sendiri.
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgxDatatableModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  @Input() rows: unknown[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() emptyMessage = 'Tidak ada data.';
}
