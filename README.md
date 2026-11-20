## Formulir LCKH berdasarkan jabatan

- Pilih jabatan utama atau salah satu penugasan rangkap, lalu Fungsi KUA, Layanan, dan Kegiatan. Fungsi dan layanan muncul jika memiliki kegiatan master untuk jabatan tersebut. Kegiatan tanpa kode standar muncul di pilihan Kegiatan operasional.
- Pencarian dan favorit mengikuti layanan yang dipilih. Jika jabatan atau fungsi berubah, pilihan di bawahnya direset. Isi Manual menggunakan fungsi yang tersedia untuk jabatan yang dipilih.
- Entri master baru mencatat jabatan yang dipilih, termasuk Operator SIMKAH. Entri lama tetap dapat dilihat dan diedit dengan jabatan dan klasifikasi historisnya. Salin kegiatan tersedia untuk jabatan yang masih aktif.
- Unggah paket ke lokasi publikasi yang sama. Pembaruan ini tidak memerlukan migrasi database. Cache PWA v7.

## Pembaruan master LCKH berdasarkan Kepdirjen Bimas Islam 888 Tahun 2026

- Formulir LCKH menggunakan filter Fungsi A–H. Setelah memilih fungsi, pengguna dapat memilih standar pelayanan di fungsi itu atau kegiatan operasional. Pencarian mencakup kedua jenis kegiatan dan mengikuti jabatan atau penugasan pengguna.
- Katalog memuat 388 pilihan, termasuk 12 tambahan. Undangan BIMWIN berada di B, penataan arsip register nikah NB/NA di A, dan pengajuan pencairan PNBP di H. BRUS tetap berada di B sebagai kegiatan operasional.
- Super Admin dapat melihat katalog bawaan dan master tambahan dalam satu tabel, dengan penyaring fungsi dan sumber. Kode lama pada master tambahan dipetakan saat aplikasi memuat data. Gunakan Edit untuk menyimpan koreksi pada baris master bersama bila diperlukan.
- Pilihan kegiatan mengisi output, bukti dukung, dan satuan. Sesuaikan hasil dan bukti dengan pekerjaan yang benar-benar dilakukan.
- Salin seluruh paket ke root repositori atau perbarui `index.html`, `sw.js`, dan modul JavaScript `01`, `02`, `06`, serta `08`. Pembaruan ini tidak memerlukan migrasi database.

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

## Pembaruan formulir LCKH

Tambahan modul `08-formulir-lckh.js` dan stylesheet `18-formulir-lckh.css`: pencarian langsung terbuka, bukti dan tautan terpisah, satuan mengikuti master saat dipilih, tanggal edit dan identitas historis dipertahankan, indikator menyimpan, serta tombol tambah pada tanggal yang sama setelah data berhasil dimuat ulang. Tautan hanya menerima HTTP/HTTPS. Bukti tetap opsional dan tidak dibuat otomatis sebagai dokumen. RKB +1 tetap dipertahankan.

## Pembaruan tampilan ringkas

Isian tautan bukti dihapus. Jenis bukti dukung tetap tersedia. Referensi lama di database dipertahankan saat edit, tetapi tidak ditampilkan dalam rekap LCKB. Teks bantuan berulang pada formulir dan beranda dipersingkat. Stylesheet `19-template-ringkas.css` merapikan formulir satu kolom, ukuran sentuh, dan ukuran teks ponsel.

## Logo SIKAP

Logo dokumen, huruf S dan centang emas diterapkan pada login, sidebar, favicon, dan ikon Apple. Berkas asli serta ukuran web berada di `assets/images/sikap-*`. Desain dibuat dengan ImageGen; aset web diperkecil dari hasil asli. Setelah unggah, muat ulang Ctrl+F5 agar ikon baru terlihat.

Logo terkini menggunakan buku terbuka dengan centang emas, menggantikan logo dokumen-S sebelumnya. Tulisan pendamping: SIKAP — Kegiatan dan Pelaporan KUA.

## Versi aplikasi dan web responsif

Paket yang sama melayani browser desktop dan ponsel serta dapat dipasang sebagai PWA. Aplikasi menggunakan akun dan database SIKAP yang sama; bukan APK Android atau aplikasi App Store.

### Pemasangan

1. Unggah seluruh isi paket ke folder publikasi GitHub Pages yang sama dengan sebelumnya. `manifest.webmanifest` dan `sw.js` harus berada di samping `index.html`.
2. Buka website melalui HTTPS.
3. Android/Chrome: tekan Pasang di header, atau gunakan menu browser → Instal aplikasi/Tambahkan ke layar utama.
4. iPhone/Safari: Bagikan → Tambahkan ke Layar Utama.
5. Komputer: gunakan tombol Pasang jika didukung browser.

Nama menu dapat berbeda menurut browser. PWA tetap membutuhkan internet untuk login, mengambil data dan menyimpan LCKH. Cache hanya berkas tampilan statis milik website, bukan respons API atau catatan pegawai. Jika tidak ada koneksi, aplikasi menampilkan pemberitahuan. Jangan menganggap tampilan shell offline sebagai bukti data terbaru.

Beranda menggunakan data pegawai sebenarnya, kalender langsung terlihat, kartu kegiatan terbaru dan tombol Isi LCKH. Riwayat berubah menjadi kartu pada ponsel dan tetap tabel pada desktop. Tidak ada foto atau angka contoh dari mockup yang dimasukkan.

Pemeriksaan lokal mencakup sintaks, manifest, ukuran ikon, referensi aset dan lingkup cache. Instalasi pada perangkat, login langsung, dan hasil visual perlu diperiksa setelah deployment HTTPS.

## Pembaruan ikon dan kalender

Ikon navigasi sekarang SVG garis, menggantikan karakter simbol lama. Kalender menggunakan kotak tanggal menyatu, ringkasan bergambar, serta legenda titik. Modul `10-ikon-dan-kalender.js` dan CSS `22-ikon-dan-kalender.css` harus diunggah bersama index terbaru. Cache PWA dinaikkan ke v2. Tutup seluruh jendela/tab aplikasi lalu buka lagi setelah deployment.

## Profil dan perbaikan legenda

Titik legenda Belum direset agar tidak mewarisi padding .empty. Nama pada header setiap halaman dihilangkan; nama pegawai tampil di kartu identitas beranda. Pengaturan foto tersedia pada Profil: pilih JPG/PNG/WebP maksimal 5 MB, gambar dipotong tengah menjadi avatar 256 px. Foto disimpan lokal di browser, dipisahkan per ID akun, bukan di database atau lintas perangkat. Hapus data browser berarti foto lokal ikut hilang. Cache PWA v3.

## Header menyatu

Baris identitas akun di atas dihilangkan dari tampilan. Tombol Muat Ulang dan Keluar asli dipindahkan ke header hijau yang sama, sehingga handler dan pengamanan tetap berjalan. Header bersama tampil setelah login, termasuk pada dashboard Admin KUA/Super Admin; tersembunyi pada halaman login. Tidak ada perubahan sesi, akun atau data. Cache PWA v4.

## Nama aplikasi dan logo tunggal

Kepanjangan SIKAP: Sistem Kinerja Pegawai KUA. Logo sidebar dihapus, sehingga halaman setelah login hanya menampilkan logo pada header hijau. Nama diperbarui pada login, header, footer, judul halaman dan manifest aplikasi. Cache PWA v5. Nama aplikasi yang sudah terpasang dapat memerlukan waktu untuk mengikuti pembaruan manifest browser.
