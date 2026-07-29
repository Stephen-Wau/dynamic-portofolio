// Label bulan Indonesia, index 0 = Januari. Dipakai formatMonth() di bawah.
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

// Format "YYYY-MM" jadi "Agu 2025". Dipakai di menu mana pun yang punya field bulan-tahun
// (Work Histories, Education, dst).
export function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-').map(Number);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

// Format rentang "YYYY-MM" → "YYYY-MM" (atau null) jadi "Agu 2025 – Sekarang"/"Agu 2025 – Jun 2026".
// endDate null berarti masih berlangsung (masih bekerja / masih menempuh pendidikan).
export function formatPeriod(startDate: string, endDate: string | null): string {
  const start = formatMonth(startDate);
  const end = endDate ? formatMonth(endDate) : 'Sekarang';
  return `${start} – ${end}`;
}
