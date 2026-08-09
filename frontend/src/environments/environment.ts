// Konfigurasi environment development, dipakai AuthService & HttpClient.
export const environment = {
  apiUrl: 'http://localhost:8081',
  // true: landing page pakai data hardcode (static-portfolio-data.ts), gak fetch API.
  useStaticData: true,
  // Landing page mana yang ditampilkan saat useStaticData true: 1, 2, atau 3.
  staticLandingPage: 1,
};
