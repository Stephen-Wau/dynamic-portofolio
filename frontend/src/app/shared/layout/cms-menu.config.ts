export interface CmsMenuItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'profile';
}

// Daftar menu sidebar CMS, tambah item baru di sini kalau ada halaman CMS baru.
export const CMS_MENU_ITEMS: CmsMenuItem[] = [
  { label: 'Dashboard', path: '/admin-cms', icon: 'dashboard' },
  { label: 'Profile', path: '/admin-cms/profile', icon: 'profile' },
];
