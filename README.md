# Mini Aplikasi Pencatatan Keuangan

Aplikasi ini bertujuan membantu pengguna (individu atau usaha kecil) mencatat arus kas (dana masuk dan keluar) per periode bulan-tahun, dengan dukungan otentikasi Google, manajemen vendor, serta laporan keuangan sederhana. Aplikasi dibangun dengan pendekatan **mobile-first**, mendukung **dark mode**, dan menggunakan **Next.js (App Router)** + **Firebase Firestore** + **Tailwind CSS** + **Material UI**.

## Fitur Utama

- **Pencatatan Keuangan**: Mudah dan cepat mengelola saldo dana masuk dan keluar per periode.
- **Laporan Keuangan**: Laporan sisa saldo, total masuk, dan total keluar per periode.
- **Otentikasi**: Akses aman melalui Google Sign-In.
- **Manajemen Vendor**: Buat atau gabung dengan kode unik vendor setelah login.
- **Mobile-first & Dark Mode**: Desain responsif dan dukungan mode gelap.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript
- **UI Library**: Tailwind CSS + Material UI
- **Database & Auth**: Firebase (Firestore & Authentication)

## Getting Started

Pastikan Anda telah menginstal [Bun](https://bun.sh/) di sistem Anda.

1. Install dependencies:
   ```bash
   bun install
   ```

2. Jalankan development server:
   ```bash
   bun run dev
   ```

3. Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

## Deployment

Proyek ini telah dikonfigurasi untuk kemudahan deploy ke [Vercel](https://vercel.com). Vercel CLI telah ditambahkan sebagai *dev dependency*. Anda dapat menggunakan Makefile yang tersedia untuk mendeploy aplikasi:

- **Preview Deployment**:
  ```bash
  make deploy-preview
  ```

- **Production Deployment**:
  ```bash
  make deploy-prod
  ```
