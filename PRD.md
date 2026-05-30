# PRD - Mini Aplikasi Pencatatan Keuangan

## 1. Pendahuluan

Aplikasi ini bertujuan membantu pengguna (individu atau usaha kecil) mencatat arus kas (dana masuk dan keluar) per periode bulan-tahun, dengan dukungan otentikasi Google, manajemen vendor, serta laporan keuangan sederhana. Aplikasi dibangun dengan pendekatan **mobile-first**, mendukung **dark mode**, dan menggunakan **Next.js (App Router)** + **Firebase Firestore** + **Tailwind CSS** + **Material UI** (sesuai panduan integrasi yang diberikan).

## 2. Tujuan

- Menyediakan pencatatan keuangan yang mudah dan cepat.
- Mengelola saldo per periode secara otomatis berdasarkan transaksi.
- Memberikan laporan sisa saldo, total masuk, dan total keluar per periode.
- Memastikan akses aman melalui Google Sign-In.
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
| State & Cache   | (Opsional) React Context / SWR    |

> Integrasi Material UI dengan Tailwind CSS mengacu pada [skill yang diberikan](https://raw.githubusercontent.com/mui/material-ui/refs/heads/master/skills/material-ui-tailwind/SKILL.md).

## 5. Fitur Utama (User Story)

1. **Login / Register**  
   - Pengguna masuk menggunakan akun Google.  
   - Setelah berhasil, sistem mengecek apakah pengguna sudah terhubung dengan suatu vendor.  
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
   - Tombol **Tambah data**: form (periode, saldo masuk, catatan) – `created_by` (diisi user ID otomatis) & `created_at` (timestamp server).

5. **Menu Dana Keluar**  
   - Sama dengan dana masuk, tetapi untuk transaksi keluar.  
   - Form: periode, saldo keluar, catatan.  
   - Otomatis isi `created_by` & `created_at`.

6. **Menu Report**  
   - Pilih periode (bulan-tahun).  
   - Tampilkan:  
     - Sisa saldo 1 periode sebelumnya (jika ada).  
     - Total dana masuk periode ini.  
     - Total dana keluar periode ini.  
     - Sisa saldo periode ini = (saldo sebelumnya + total masuk - total keluar).

7. **Manajemen Saldo & Periode**  
   - **Master Saldo per Periode** (collection `periodBalances`):  
     - `id`: `${year}-${month}`  
     - `year`, `month`, `balance` (saldo akhir periode)  
   - **Aturan**  
     - Periode pertama kali pengguna membuat vendor → saldo awal = 0.  
     - Jika ada periode sebelumnya, saldo periode baru = saldo akhir periode sebelumnya.  
     - Setiap kali transaksi (masuk/keluar) dibuat, **update saldo periode terkait**:  
       - Dana masuk → `balance += amount`  
       - Dana keluar → `balance -= amount`  
     - Update harus **transaksional** (gunakan batched write atau transaction di Firestore).  
   - Penentuan periode saat ini: `new Date()` => bulan, tahun.

8. **Fitur Umum**  
   - Mobile-first & responsif.  
   - Dark mode (toggle atau mengikuti sistem).  
   - Logout di halaman authenticated.

## 6. Struktur Data Firestore

### `vendors`
| Field        | Type          | Keterangan                          |
|--------------|---------------|-------------------------------------|
| `id`         | string (auto) | ID dokumen (bisa digunakan sebagai kode unik) atau field `code` terpisah. |
| `name`       | string        | Nama vendor                         |
| `code`       | string        | Kode unik untuk bergabung (generate random) |
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
| Field       | Type      | Keterangan                                 |
|-------------|-----------|--------------------------------------------|
| `vendorId`  | string    |                                            |
| `type`      | string    | "IN" atau "OUT"                            |
| `amount`    | number    | Saldo positif selalu                       |
| `period`    | string    | `${year}-${month}` (untuk filter cepat)    |
| `year`      | number    | Denormalisasi untuk query                  |
| `month`     | number    |                                            |
| `note`      | string    | Catatan (optional)                         |
| `createdBy` | string    | UID user                                   |
| `createdAt` | timestamp |                                            |

> **Indexing**:  
> - `transactions`: `vendorId` + `period` + `createdAt` DESC  
> - `periodBalances`: `vendorId` + `year` + `month` (unik)

## 7. Rincian Fase Pengerjaan

### Fase 1 – Skeleton Project, Login/Register, Vendor

**Tujuan**: Membangun fondasi proyek, otentikasi Google, dan alur hubungkan vendor.

**Hasil Deliverable**:
- Inisialisasi proyek Next.js (TypeScript, Tailwind, Bun).
- Setup Firebase SDK (Auth, Firestore).
- Halaman `/login` dengan tombol "Masuk dengan Google".
- Handle callback dari Firebase Auth, simpan user di state global (misal Context).
- Middleware / route protection: hanya user terautentikasi yang bisa akses halaman authenticated.
- Halaman `/connect-vendor` (akses setelah login jika belum terhubung ke vendor manapun):
  - Form input kode vendor (untuk bergabung ke vendor yang sudah ada).
  - Form buat vendor baru: nama vendor → simpan ke `vendors` & buat kode unik.
  - Setelah vendor terhubung, simpan `vendorId` dan `role` di state/context/localStorage (atau di user metadata).
  - Redirect ke `/dashboard`.
- Komponen dasar: Navbar sederhana, layout dengan container responsif.
- Halaman `/logout` atau tombol logout (belum butuh halaman authenticated lainnya).
- Struktur folder:
  ```
  app/
    (auth)/
      login/page.tsx
      connect-vendor/page.tsx
    (dashboard)/
      layout.tsx (protected)
      page.tsx (sementara kosong)
    api/
      ...
  components/
    common/
  lib/
    firebase/
    context/
  types/
  ```

**Catatan Teknis**:
- Gunakan `@mui/material` + `@emotion/react` + `@emotion/styled`, lalu ikuti panduan integrasi dengan Tailwind (lewat `className` MUI bisa digabung dengan utility Tailwind).
- Dark mode awal: pakai `next-themes` atau state manual dengan CSS variables.

---

### Fase 2 – Manajemen Saldo+Periode, Dashboard, Profile, Logout

**Tujuan**: Membangun logika inti saldo per periode, tampilan dashboard, dan fitur profil/logout.

**Hasil Deliverable**:
- Model & helper Firestore untuk manajemen saldo:
  - Fungsi `getOrCreatePeriodBalance(vendorId, year, month)`: mengambil atau membuat saldo periode dengan nilai awal (0 jika pertama kali, atau mengambil `balance` dari periode sebelumnya jika ada).
  - Fungsi `updateBalanceForTransaction(vendorId, period, amount, type)`: menggunakan **transaction** Firestore untuk:
    - Baca saldo periode saat ini.
    - Update saldo: `balance += amount` (untuk IN) atau `balance -= amount` (untuk OUT).
    - Simpan kembali.
- **Peringatan**: Pastikan transaksi (insert transaction + update balance) dilakukan dalam satu transaction Firestore. Karena Firestore tidak mendukung multi-collection transaction secara native? Bisa gunakan batched write jika urutan tidak masalah, tapi untuk read-modify-write harus transaction.
  - Solusi: Gunakan transaction yang membaca `periodBalances` dan menulis `transactions` dan `periodBalances` sekaligus.

- Halaman Dashboard (`/dashboard`):
  - Ambil periode saat ini (bulan, tahun).
  - Query `periodBalances` untuk mendapatkan saldo periode ini? (sebenarnya saldo periode adalah saldo akhir, tapi di dashboard kita butuh total masuk dan keluar periode ini, serta sisa saldo saat ini = saldo periode sebelumnya + masuk - keluar).
  - Tampilkan:
    - Periode (format: "Maret 2025")
    - Total dana masuk periode ini: sum `amount` dari `transactions` dengan `type="IN"` dan `period` = sekarang.
    - Total dana keluar periode ini: sum `type="OUT"`.
    - 5 transaksi terakhir dari vendor: query `transactions` order by `createdAt` desc, limit 5 (tanpa filter type).
  - Tambahkan loading state & error handling.

- Halaman Profile sederhana (`/profile`):
  - Tampilkan informasi user (email, nama dari Google).
  - Tombol Logout → panggil `signOut` Firebase → redirect ke `/login`.
  - (Opsional) Tampilkan kode vendor yang sedang diikuti.

- Integrasi logout di navbar atau menu.
- Pastikan semua halaman dalam `(dashboard)` menggunakan layout yang sudah dilindungi middleware dan menyediakan sidebar/navbar bottom untuk navigasi:
  - Dashboard
  - Dana Masuk
  - Dana Keluar
  - Report
  - Profile

**Catatan**:
- Gunakan SWR atau React Query untuk data fetching yang reusable.
- Implementasi lazy loading belum di fase ini, cukup basic fetch.

---

### Fase 3 – Menu Dana Masuk

**Tujuan**: Implementasi fitur dana masuk lengkap dengan filter periode, lazy loading list, dan tambah transaksi.

**Hasil Deliverable**:
- Halaman `/cash-in` (Dana Masuk).
- Komponen **Filter**:
  - Pilih tahun (gunakan Material UI `DatePicker` atau select tahun).
  - State filter disimpan di URL query (misal `?year=2026`).
- **List transaksi masuk**:
  - Menggunakan infinite scroll / lazy loading dengan paging (batch 10 item).
  - Query ke `transactions` dengan kondisi:
    - `vendorId` = current,
    - `type` = "IN",
    - `year` = filter (jika ada, kalau tidak pakai tahun default = sekarang).
    - Order by `createdAt` DESC.
  - Implementasi load more: saat scroll mencapai bawah, fetch page berikutnya.
  - Tampilan item: `amount` (format rupiah), `createdBy` (dari user? bisa tampilkan email atau nama), `createdAt` (format tanggal jam).
- **Tombol Tambah Data** (floating action button atau di atas list):
  - Buka modal/form dengan input:
    - Periode (default periode sekarang, bisa diubah ke periode lain). Validasi periode tidak boleh lebih besar dari sekarang? Boleh saja mencatat ke periode lampau atau mendatang? Disarankan tidak lebih dari bulan depan (opsional).
    - Saldo masuk (number positif).
    - Catatan (textarea opsional).
  - Submit: panggil fungsi `addTransaction` yang:
    - Validasi jumlah > 0.
    - Panggil transaction Firestore: simpan dokumen `transactions` + update `periodBalances` untuk periode tersebut.
    - Setelah sukses, refresh list (invalidate query) dan tutup modal.
- Notifikasi sukses/gagal (Snackbar MUI).

- Pastikan property `created_by` diisi `currentUser.uid`, `created_at` adalah `serverTimestamp()`.

- **Testing**: Coba tambah beberapa data masuk, pastikan saldo di master saldo periode terkait terupdate.

---

### Fase 4 – Menu Dana Keluar & Laporan

**Tujuan**: Menyelesaikan fitur dana keluar dan laporan keuangan per periode.

**Hasil Deliverable**:
- Halaman `/cash-out` (Dana Keluar):
  - Struktur identik dengan dana masuk, tapi `type = "OUT"`.
  - Filter periode, paging lazy loading.
  - Form tambah data: periode, saldo keluar, catatan.
  - Validasi saldo keluar tidak boleh melebihi saldo yang tersedia **pada periode tersebut**? (opsional, bisa ditambahkan validasi). Namun karena kita update saldo secara atomik, jika saldo menjadi negatif bisa ditolak di sisi business logic.
- Halaman `/report`:
  - Pilih periode (default periode sekarang).
  - Tampilkan:
    - **Saldo awal periode** = ambil `balance` dari periode sebelumnya (jika tidak ada, 0).
    - **Total dana masuk periode ini** (query sum from `transactions` type IN, period).
    - **Total dana keluar periode ini**.
    - **Sisa saldo akhir periode** = saldo awal + total masuk - total keluar. Sisa ini harus sama dengan `periodBalances.balance` (bisa ditampilkan juga dari master).
  - Bisa ditambahkan grafik sederhana (opsional, menggunakan recharts).
- Fix semua bug dari fase sebelumnya.
- **Optimasi & polish**:
  - Pastikan dark mode bekerja konsisten.
  - Responsif: di mobile, tabel/list pakai card-style.
  - Loading skeleton untuk setiap list.
  - Error boundary untuk Firestore errors.

- Dokumentasi akhir dan testing manual.

## 8. Catatan Implementasi Penting

1. **Transaction Firestore untuk Update Balance**  
   Karena kita harus membaca saldo periode lalu menulis ulang bersamaan dengan insert transaksi, gunakan `runTransaction` yang mencakup kedua operasi. Contoh:
   ```ts
   await runTransaction(db, async (transaction) => {
     const balanceRef = doc(db, 'periodBalances', `${vendorId}_${period}`);
     const balanceDoc = await transaction.get(balanceRef);
     let newBalance = balanceDoc.exists() ? balanceDoc.data().balance : 0;
     if (type === 'IN') newBalance += amount;
     else newBalance -= amount;
     transaction.set(balanceRef, { balance: newBalance, vendorId, year, month }, { merge: true });
     transaction.set(transactionDocRef, transactionData);
   });
   ```

2. **Kode Unik Vendor**  
   Generate random string 6 karakter (huruf besar + angka). Pastikan unik dengan mengecek koleksi `vendors` field `code`.

3. **User & Vendor Context**  
   Buat context `AppContext` yang menyimpan `user`, `vendorId`, `vendorCode`, dan metode logout/switch vendor (jika diperlukan).

4. **Paging Lazy Loading**  
   Gunakan teknik `startAfter` dengan last document snapshot. Simpan `lastDocRef` untuk setiap query filter.

5. **Middleware**  
   Next.js middleware memeriksa cookie session Firebase (setelah login). Redirect ke `/login` jika tidak ada sesi, kecuali untuk halaman public.

## 9. Deliverable Akhir

- Repository GitHub dengan commit per fase.
- Aplikasi dapat dijalankan dengan `bun install` lalu `bun run dev`.
- Dokumentasi singkat cara menjalankan dan fitur yang sudah jadi.
- Deployment ke Vercel (disarankan) agar dapat diakses.