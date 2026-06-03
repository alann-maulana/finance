# PRD - Mini Aplikasi Pencatatan Keuangan

## 1. Pendahuluan

Aplikasi ini bertujuan membantu pengguna (individu atau usaha kecil) mencatat arus kas (dana masuk dan keluar) per periode bulan-tahun, dengan dukungan otentikasi Google, manajemen vendor, serta laporan keuangan sederhana. Aplikasi dibangun dengan pendekatan **mobile-first**, mendukung **dark mode**, dan menggunakan **Next.js (App Router)** + **Firebase Firestore** + **Tailwind CSS** + **Material UI** (sesuai panduan integrasi yang diberikan).

## 2. Tujuan

- Menyediakan pencatatan keuangan yang mudah dan cepat.
- Mengelola saldo per periode secara otomatis berdasarkan transaksi.
- Memberikan laporan sisa saldo, total masuk, dan total keluar per periode.
- Memastikan akses aman melalui Google Sign-In dengan alur verifikasi admin.
- Mendukung pengaturan vendor (buat/input kode unik vendor) setelah login/register.

## 3. Target Pengguna

- Pengguna perorangan yang ingin mencatat keuangan pribadi.
- Pemilik usaha kecil yang memerlukan pencatatan dana masuk/keluar sederhana.

## 4. Tech Stack

| Komponen        | Teknologi                         |
|----------------|-----------------------------------|
| Runtime         | Bun                               |
| Bahasa          | TypeScript                        |
| Framework       | Next.js (App Router)              |
| UI Library      | Tailwind CSS + Material UI        |
| Autentikasi     | Firebase Auth (Google Sign-In)    |
| Database        | Firebase Firestore                |
| Notifikasi      | Firebase Cloud Messaging (FCM)    |
| State & Cache   | React Context                     |

> Integrasi Material UI dengan Tailwind CSS mengacu pada panduan resmi interop.

## 5. Fitur Utama (User Story)

1. **Login / Register & Verifikasi**  
   - Pengguna masuk menggunakan akun Google.
   - Setelah login, sistem akan mengecek status `verified` pada akun pengguna.
   - Jika pengguna baru, akun akan berstatus belum diverifikasi, pengguna diarahkan ke halaman `/not-verified` menunggu verifikasi manual dari admin.
   - Setelah diverifikasi, sistem mengecek apakah pengguna sudah terhubung dengan suatu vendor.  
   - Jika **belum terhubung**, tampilkan halaman penghubung vendor (pilih: input kode vendor yang sudah ada, atau buat vendor baru).  
   - Setelah vendor terhubung, pengguna diarahkan ke dashboard.

2. **Manajemen Vendor**  
   - Buat vendor baru: input nama vendor → sistem *generate* kode unik (misal: random 6 karakter alfanumerik) dan simpan.  
   - Hubungkan ke vendor yang sudah ada: input kode vendor yang diketahui → validasi kode ada di Firestore → hubungkan.

3. **Dashboard Keuangan**  
   - Menampilkan periode saat ini (bulan, tahun).  
   - Total dana masuk periode ini.  
   - Total dana keluar periode ini.  
   - 5 transaksi terakhir (gabungan masuk+keluar, diurutkan berdasarkan `created_at` DESC).

4. **Menu Dana Masuk**  
   - Filter berdasarkan tahun.  
   - Paging (default 10 item per halaman, lazy loading/infinite scroll saat scroll ke bawah).  
   - List menampilkan: saldo masuk, user (email / displayName), tanggal jam masuk.  
   - Tombol **Tambah data**: form (periode, saldo masuk, catatan) – `createdBy` (diisi user ID otomatis), `createdByName` (nama user), & `createdAt` (timestamp server).

5. **Menu Dana Keluar**  
   - Sama dengan dana masuk, tetapi untuk transaksi keluar.  
   - Form: periode, saldo keluar, catatan.  
   - Otomatis isi `createdBy`, `createdByName` & `createdAt`.
   - **Update dan Delete Transaksi**: Mendukung pembaruan saldo keluar atau penghapusan transaksi keluar, di mana saldo master `periodBalances` akan secara otomatis dikalkulasikan (dikembalikan atau disesuaikan).

6. **Menu Report**  
   - Pilih periode (bulan-tahun).  
   - Tampilkan:  
     - Sisa saldo 1 periode sebelumnya (jika ada).  
     - Total dana masuk periode ini.  
     - Total dana keluar periode ini.  
     - Sisa saldo periode ini = (saldo sebelumnya + total masuk - total keluar).

7. **Manajemen Saldo & Periode**  
   - **Master Saldo per Periode** (collection `periodBalances`):  
     - `id`: `${vendorId}_${year}-${month}`  
     - `year`, `month`, `balance` (saldo akhir periode)  
   - **Aturan**  
     - Periode pertama kali pengguna membuat vendor → saldo awal = 0.  
     - Jika ada periode sebelumnya, saldo periode baru = saldo akhir periode sebelumnya.  
     - Setiap kali transaksi (masuk/keluar) dibuat, dihapus, atau diubah, **update saldo periode terkait**:  
       - Dana masuk → `balance += amount`  
       - Dana keluar → `balance -= amount`  
     - Update harus **transaksional** (gunakan `runTransaction` di Firestore).  
   - Penentuan periode saat ini: `new Date()` => bulan, tahun.

8. **Fitur Push Notification**
   - Menggunakan Firebase Cloud Messaging (FCM).
   - Pengguna menerima notifikasi push ke perangkat saat ada aktivitas di dalam vendor yang sama, seperti:
     - Pengguna menginput dana masuk.
     - Pengguna menginput dana keluar.
     - Pengguna baru bergabung ke dalam vendor.

9. **Fitur Umum**  
   - Mobile-first & responsif.  
   - Dark mode (mengikuti sistem atau tampilan default khusus aplikasi).  
   - Logout di halaman authenticated.

## 6. Struktur Data Firestore

### `users` (Verifikasi & Profil User)
| Field       | Type      | Keterangan                        |
|-------------|-----------|-----------------------------------|
| `uid`       | string    | UID Firebase Auth                 |
| `email`     | string    | Email user                        |
| `name`      | string    | Nama tampilan                     |
| `verified`  | boolean   | Status verifikasi manual admin    |
| `fcmToken`  | string    | Token Firebase Cloud Messaging    |

### `vendors`
| Field        | Type          | Keterangan                          |
|--------------|---------------|-------------------------------------|
| `id`         | string (auto) | ID dokumen                          |
| `name`       | string        | Nama vendor                         |
| `code`       | string        | Kode unik untuk bergabung (6 chars) |
| `createdAt`  | timestamp     |                                     |
| `createdBy`  | string (UID)  |                                     |

### `vendorMembers` (hubungan user <-> vendor)
| Field         | Type    | Keterangan               |
|---------------|---------|--------------------------|
| `vendorId`    | string  |                          |
| `userId`      | string  | UID dari Firebase Auth   |
| `role`        | string  | "admin" (pembuat) atau "member" |
| `joinedAt`    | timestamp |                        |

### `periodBalances` (master saldo per periode)
| Field     | Type      | Keterangan                        |
|-----------|-----------|-----------------------------------|
| `vendorId`| string    |                                   |
| `year`    | number    |                                   |
| `month`   | number    |                                   |
| `balance` | number    | Saldo akhir periode (default 0)   |

### `transactions` (dana masuk & keluar)
| Field          | Type      | Keterangan                                 |
|----------------|-----------|--------------------------------------------|
| `vendorId`     | string    |                                            |
| `type`         | string    | "IN" atau "OUT"                            |
| `amount`       | number    | Saldo positif selalu                       |
| `period`       | string    | `${year}-${month}` (untuk filter cepat)    |
| `year`         | number    | Denormalisasi untuk query                  |
| `month`        | number    |                                            |
| `note`         | string    | Catatan (optional)                         |
| `createdBy`    | string    | UID user                                   |
| `createdByName`| string    | Nama user (opsional)                       |
| `createdAt`    | timestamp |                                            |

> **Indexing**:  
> - `transactions`: `vendorId` + `type` + `year` + `createdAt` DESC  
> - `transactions`: `vendorId` + `type` + `period` + `createdAt` DESC  
> - `transactions`: `vendorId` + `period` + `createdAt` DESC  

## 7. Rincian Fase Pengerjaan (Implementasi Saat Ini)

Aplikasi telah mengimplementasikan fase-fase berikut:

### Fase 1 – Skeleton Project, Login/Register, Verifikasi Admin, Vendor
- Inisialisasi proyek Next.js dengan App Router, TypeScript, Tailwind CSS, dan Material UI.
- Setup Firebase SDK (Auth, Firestore).
- Implementasi middleware dan Context API untuk autentikasi.
- **Halaman `/login`** dengan autentikasi Google.
- **Halaman `/not-verified`**: Flow baru di mana pengguna yang baru login untuk pertama kali harus menunggu verifikasi (`verified: true`) dari Admin.
- **Halaman `/connect-vendor`**: Fasilitas bergabung ke vendor dengan kode atau membuat vendor baru.

### Fase 2 – Manajemen Saldo+Periode, Dashboard, Profile, Logout
- Fungsi transaksional Firestore menggunakan `runTransaction` untuk insert/update di `transactions` dan update atomik di `periodBalances`.
- **Halaman `/dashboard`**: Menampilkan ringkasan dana masuk, dana keluar, saldo saat ini, serta list 5 transaksi terbaru.
- **Halaman `/profile`**: Menampilkan info user dan fasilitas logout.

### Fase 3 – Menu Dana Masuk
- **Halaman `/cash-in`**: Implementasi daftar transaksi masuk.
- Lazy loading / paging data transaksi menggunakan query `startAfter` dari Firestore cursor.
- Modal penambahan transaksi masuk (`type: 'IN'`).

### Fase 4 – Menu Dana Keluar & Laporan
- **Halaman `/cash-out`**: Implementasi daftar transaksi keluar.
- Modal penambahan transaksi keluar (`type: 'OUT'`).
- Update dan Delete: Fasilitas mengupdate saldo dan menghapus transaksi (khusus cash-out), dengan kompensasi pembaruan master `periodBalances` secara terintegrasi.
- **Halaman `/report`**: Menyajikan rekapan saldo awal, dana masuk, dana keluar, dan saldo akhir pada bulan yang dipilih.

### Fase 5 – Push Notification
- Mengaktifkan Firebase Cloud Messaging (FCM) dan meminta izin browser (`Notification API`).
- Pendaftaran token FCM dan menyimpannya di Firestore untuk tiap user.
- Mengirim push notification ke anggota dalam satu vendor yang sama saat ada input dana masuk, dana keluar, atau anggota baru yang bergabung.
- Service worker terdedikasi untuk menangani notifikasi push di background.