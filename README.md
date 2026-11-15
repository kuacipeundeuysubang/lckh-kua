# SIKAP — paket GitHub

Paket ini memisahkan halaman, stylesheet, JavaScript, dan gambar. Semua revisi terakhir sudah disertakan.

## Cara unggah

1. Ekstrak ZIP ini terlebih dahulu.
2. Buka repository GitHub website SIKAP yang digunakan sekarang.
3. Unggah **isi paket**: `index.html`, folder `assets`, `README.md`, dan `.nojekyll` ke folder publikasi yang sama. Jangan mengunggah ZIP saja.
4. Jika repository menggunakan folder utama (root), pastikan `index.html` berada langsung di root, bukan di dalam folder `sikap-github`. Jika publikasinya memakai `docs`, letakkan isi paket di `docs`.
5. Commit perubahan. Tunggu proses GitHub Pages/deployment selesai, lalu muat ulang dengan Ctrl+F5.

Jangan menghapus file repository lain seperti CNAME, konfigurasi deployment, SQL, atau fungsi server. Pertahankan domain, database, konfigurasi Supabase, dan hak akses yang sudah berjalan. Paket ini tidak membuat database atau fungsi server baru.

## Pembagian berkas

- `index.html`: struktur halaman dan elemen formulir.
- `assets/css/`: tampilan dasar, cetak, login, admin, kalender, riwayat, dan penyempurnaan tampilan. Nomor menjaga urutan aturan CSS yang sudah bekerja.
- `assets/js/01-kegiatan-dan-laporan.js`: master bawaan, beranda/kalender, input/riwayat LCKH, generator laporan, CSV, dan profil.
- `assets/js/02-autentikasi-dan-admin.js`: koneksi, login/sesi, penyimpanan online, monitoring dan cetak admin.
- `assets/js/03-pengelolaan-akun.js`: tampilan pengelolaan akun berdasarkan peran.
- `assets/js/04-visibilitas-sandi.js`: tombol tampil/sembunyikan sandi.
- `assets/js/05-penugasan-rangkap.js`: penugasan rangkap.
- `assets/js/06-master-kegiatan.js`: pengelolaan master bersama.
- `assets/js/07-edit-identitas.js`: edit identitas pegawai.
- `assets/images/`: logo/ikon yang sebelumnya tertanam di HTML.

Urutan pemuatan JavaScript tetap sama. Sejumlah fungsi masih menggunakan variabel global bersama; jangan mengganti urutannya atau menambahkan async/defer secara terpisah. Ini tahap pemisahan berkas, belum penulisan ulang arsitektur aplikasi.

## Aturan yang dipertahankan

- Pegawai mengisi LCKH sebagai sumber laporan.
- RKB memakai periode yang sama, volume masing-masing entri LCKH +1.
- LCKB: satu baris per layanan, poin kegiatan di satu sel, dengan volume dan bukti dukung bernomor sesuai poin.
- Kalender tampil paling atas beranda pada ponsel.
- Aturan/filter WFO tetap seperti sebelumnya.

## Pemeriksaan setelah dipasang

Periksa login, kalender ponsel, simpan/edit LCKH, cetak LCKB dari akun pegawai dan admin, serta volume RKB +1. Paket telah diperiksa sintaks JavaScript dan keterhubungan aset lokal. Tampilan browser, login, dan koneksi database langsung belum diverifikasi di lingkungan pengujian ini. Supabase JS tetap dimuat dari CDN dan membutuhkan internet.
