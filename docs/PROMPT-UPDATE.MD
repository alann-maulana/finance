# Fitur Detail, Edit dan Hapus Dana Keluar

## Detail Dana Keluar
- Buatkan halaman detail untuk menampilkan dana keluar dengan menampilkan property periode, saldo keluar, catatan, user yang menginput dan hari-jam dilakukan input

## Edit Dana Keluar
- Tambahkan tombol floating icon edit, dengan action menjadikan property menjadi editable :
    1. saldo keluar
    2. catatan
- Ketika edit aktif, munculkan tombol save untuk melakukan penyimpanan data dengan ketentuan :
    1. Hitung `selisih` = `saldo lama` - `saldo baru`
    2. Jika hasil `selisih` negatif, maka kurangkan `periodBalances` pada periode yang sama
    3. Jika hasil `selisih` positif, maka tambahkan `periodBalances` pada periode yang sama

## Hapus Dana Keluar
- Tambahkan tombol icon more > icon hapus pada action bar, dengan action :
    1. Tampilkan popup konfirmasi penghapusan
    2. Jika dipilih tidak, maka tutup popup konfirmasi
    3. Jika dipilih hapus, maka :
        - Tutup popup konfirmasi lalu tampilkan loading
        - Update batch firestore untuk :
            1. Tambahkan `periodBalances` di periode yang sama dengan saldo dana keluar yang akan dihapus
            2. Hapus document collection dana keluar
        - Tampilkan pesan data telah dihapus, dengan tombol OK
        - Action OK : kembali ke halaman daftar dana keluar

# Fitur Sync Periode
- Buatkan local storage untuk penyimpanan data periode: `bulan` dan `tahun`
- Setiap perubahan data periode dari halaman dashboard, dana keluar dan laporan. Simpan pada local storage
- Lakukan sync pada dropdown :
    - Periode (`bulan` dan `tahun`) pada halaman dashboard, dana keluar dan laporan
    - `tahun` terpilih pada halaman dana masuk
- Jangan lakukan penyimpanan ke local storage ketika ada perubahan dropdown periode pada form dana masuk dan keluar

# Fitur Verified User
- There is collection `users` with property :
    - `uid`, the user UID from authentication
    - `email`, email address from user
    - `name`, fullname from user
    - `verified`, flag boolean that indicate user is verified. Default is `false`
- If user registered 1st time :
    - Create 1 document using id from user UID dari authentication
    - Store `email` and `name` along
    - Set `verified` to `false`. It only can be changed manually via Firestore Console
- After user login/register then create a vendor/join an already existing vendor. Check for `verified` flag :
    - If `verified=true`, show dashboard, income, outcome, report and profile page like normally
    - Else, show a new page indicating that user is not verified yet and show message to contact admin to manually verified them. Do not allow to access any other pages

# Fitur Push Notification
Tambahkan push notification kepada sesama pengguuna di dalam vendor yang sama, ketika :
- Pengguna menginput dana masuk
- Pengguna menginput dana keluar
- Pengguna baru bergabung dalam vendor

# Fitur Kategori transaksi
- Tambahkan collection baru `categories` dengan property :
    - `name`, nama kategori transaksi
    - `description`, deskripsi dari kategori transaksi
    - `created_by` dan `created_at` diset otomatis
- Tambahkan isian awal kategori :
    - Belanja
    - Obat
    - Nabung
    - Les
    - Jajan
    - Laundry
    - Bensin
    - Internet
    - Air
    - Kos
- Update fitur :
    1. Tambahkan dropdown pilihan kategori ketika tambah dan edit transaksi. Opsional
    2. Ketika diset kategori ke transaksi, simpan sebagai tipe `reference`
    3. Pada setiap tile di daftar pengeluaran, tampilkan nama kategorinya sebagai chip

Jika ada yang kurang jelas silakan tanya dan tampilkan juga asumsi awalmu