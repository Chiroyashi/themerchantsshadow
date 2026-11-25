# The Merchant's Shadow

Game sosial berbasis React + Vite dengan Firebase Realtime Database.

## Persyaratan

- Node.js >= 20.19
- Akun Firebase dengan Realtime Database dan Anonymous Authentication aktif

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Isi `.env` dengan konfigurasi web Firebase proyek Anda. Nilai config web Firebase bersifat publik di browser; keamanan data bergantung pada Firebase Security Rules, bukan kerahasiaan config.

## Script

- `npm run dev` — menjalankan server pengembangan
- `npm test` — menjalankan test Node
- `npm run lint` — menjalankan ESLint
- `npm run build` — membuat build produksi di `dist/`
- `npm run preview` — melihat build produksi secara lokal

## Aturan Firebase

Security Rules ada di `database.rules.json`. Setiap perubahan rules wajib di-deploy ulang ke Firebase Console atau Firebase CLI.

## Deploy

Target deploy utama adalah Vercel (proyek Vite, root `/`). `public/404.html` dipakai sebagai fallback SPA. Build dihasilkan oleh `npm run build`.

CI menjalankan `npm ci`, `npm test`, `npm run lint`, lalu `npm run build` untuk push dan pull request ke `main`.
