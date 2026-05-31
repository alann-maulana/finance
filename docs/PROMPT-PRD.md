Buatkan PRD untuk membuat mini aplikasi pencatatan keuangan dengan fitur :
- Login dan register menggunakan google sign in (include fitur logout di halaman authenticated)
- Selesai register atau login dan belum terhubung ke vendor :
    - Jika memiliki kode vendor, bisa tinggal diinput. 
    - Jika belum, bisa create vendor dengan inputan nama vendor. Selesai disimpan maka otomatis akan generate kode unik vendor.
- [Authenticated] Masuk ke halaman utama, tampilkan dashboard keuangan: 
    - Periode saat ini : bulan dan tahun
    - Dana masuk periode ini
    - Dana keluar periode ini
    - 5 transaksi terakhir
- [Authenticated] Menu dana masuk :
    - Filter : periode, paging (default 10)
    - Tampilan list : saldo, user, tanggal jam masuk. Buat dengan lazy loading list dengan paging data.
    - Tambah data, form : periode, saldo masuk, catatan. Property `created_by` dan `created_at` diset otomatis
- [Authenticated] Menu dana keluar :
    - Filter : periode, paging (default 10)
    - Tampilan list : saldo, user, tanggal jam keluar. Buat dengan lazy loading list dengan paging data.
    - Tambah data, form : periode, saldo keluar, catatan. Property `created_by` dan `created_at` diset otomatis
- [Authenticated] Menu report
    - Laporan keuangan per periode : list sisa saldo 1 periode sebelumnya, dana masuk dalam periode dan dana keluar dalam periode

Manajemen Saldo dan Periode :
- Terdapat master saldo tiap periode : bulan dan tahun
- Saldo di periode pertama dibuat adalah nol. Jika terdapat sisa saldo di periode sebelumnya, jadikan saldo di periode saat ini
- Saldo tiap periode akan otomatis diupdate dengan ketentuan :
    - Saldo bertambah ketika terdapat dana masuk
    - Saldo berkurang ketika terdapat dana keluar
- Diperbolehkan saldo minus

Fitur umum :
- Diutamakan mobile view first
- Tampilan clean dengan support dark mode
- Integrasikan material ui ke tailwind css dengan skill berikut https://raw.githubusercontent.com/mui/material-ui/refs/heads/master/skills/material-ui-tailwind/SKILL.md

Tech stack :
- Firebase Firestore
- Bun
- Typescript
- NextJS
- Tailwind CSS

Bagi PRD tersebut menjadi 4 fase : 
1. Skeleton project folder+files utama, login/register, vendor
2. Manajemen saldo+periode, dashboard, profile, logout
3. Menu dana masuk
4. menu dana keluar