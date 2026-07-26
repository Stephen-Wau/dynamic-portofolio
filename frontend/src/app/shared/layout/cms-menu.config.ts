export interface CmsMenuItem {
  label: string;
  path: string;
}

// Daftar menu sidebar CMS, tambah item baru di sini kalau ada halaman CMS baru.
export const CMS_MENU_ITEMS: CmsMenuItem[] = [{ label: 'Dashboard', path: '/admin-cms' }];
