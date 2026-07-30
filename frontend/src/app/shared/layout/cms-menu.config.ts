export interface CmsMenuItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'profile' | 'work-histories' | 'education' | 'skills';
}

// Daftar menu sidebar CMS, tambah item baru di sini kalau ada halaman CMS baru.
export const CMS_MENU_ITEMS: CmsMenuItem[] = [
  { label: 'Dashboard', path: '/admin-cms', icon: 'dashboard' },
  { label: 'Profile', path: '/admin-cms/profile', icon: 'profile' },
  { label: 'Work Histories', path: '/admin-cms/work-histories', icon: 'work-histories' },
  { label: 'Education', path: '/admin-cms/education', icon: 'education' },
  { label: 'Skill', path: '/admin-cms/skills', icon: 'skills' },
];
