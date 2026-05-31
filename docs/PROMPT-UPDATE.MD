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