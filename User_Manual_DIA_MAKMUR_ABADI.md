# BUKU PANDUAN PENGGUNA (USER MANUAL)
**SISTEM MANAJEMEN INVENTORI - DIA MAKMUR ABADI**

---

## DAFTAR ISI
1. [Pendahuluan](#pendahuluan)
2. [Akses Sistem (Login & Keamanan)](#akses-sistem)
3. [Modul Sales (Tenaga Penjualan)](#modul-sales)
4. [Modul Admin Gudang / Operasional](#modul-admin)
5. [Modul Pengajuan Harga & Retur](#modul-pengajuan)
6. [Kendala Umum & Solusi](#kendala-umum)

---

## 1. PENDAHULUAN
Aplikasi Sistem Inventori DIA MAKMUR ABADI adalah platform berbasis Web dan Mobile (PWA) yang dirancang untuk mengintegrasikan proses pemesanan barang oleh Sales di lapangan dengan sistem gudang pusat (Admin). 
Aplikasi ini sudah mendukung perhitungan stok *real-time*, konversi multi-satuan (Misal: 1 Dus = 24 Pcs), serta pelacakan titik lokasi GPS saat kunjungan toko.

## 2. AKSES SISTEM (LOGIN)
Setiap karyawan memiliki peran (*Role*) masing-masing:
- **Sales:** Akses terbatas hanya untuk melihat katalog, membuat pesanan (Pre-Order), melacak kunjungan toko, dan memantau status pesanannya.
- **Admin:** Akses penuh untuk manajemen stok (Masuk/Keluar), menyetujui pesanan Sales, mengelola Master Produk, dan melakukan retur barang.
- **Super Admin:** Sama dengan Admin, ditambah dengan laporan analitik lengkap dan akses hapus data permanen.

**Cara Login:**
1. Buka tautan aplikasi (URL) di Browser HP / Laptop Anda.
2. Masukkan Email dan Password yang telah didaftarkan.
3. Klik tombol **Login**.

---

## 3. MODUL SALES (UNTUK TENAGA PENJUALAN)

### A. Membuat Pesanan Baru (Pre-Order)
Ini adalah fitur utama yang digunakan saat Anda berada di toko pelanggan.
1. Pilih menu **Buat Pesanan Baru** dari Dashboard.
2. Anda akan melihat **Katalog Produk**. Gunakan kolom pencarian untuk mencari nama barang.
3. Klik tombol **+ Tambah** pada barang yang diinginkan.
4. Pilih **Satuan** (Dus / Pcs) jika tersedia. Masukkan **Jumlah (Qty)**.
5. Klik ikon Keranjang di pojok bawah (atau *Sticky Footer*). 
6. Lengkapi **Data Pelanggan** (Nama Toko, Alamat, Nomor WA).
7. (Opsional) Masukkan **Uang Muka / DP** jika pelanggan langsung membayar sebagian.
8. Klik **Kirim Pre-Order**. 
*Catatan: Pesanan Anda sekarang berstatus `PENDING` dan menunggu persetujuan Admin.*

### B. Pengajuan Harga Khusus (Price Proposal)
Jika pelanggan meminta diskon atau harga grosir di bawah harga standar aplikasi:
1. Ubah nominal **Harga Satuan** di dalam Keranjang secara manual (ketik harga baru).
2. Sistem akan mendeteksi bahwa harga diturunkan. Tombol kirim akan otomatis berubah menjadi **Ajukan Persetujuan Harga**.
3. Wajib mengisi kolom **Catatan / Alasan** mengapa harga diturunkan (contoh: "Pelanggan VIP beli partai besar").
4. Klik Kirim. Admin akan mereview pengajuan ini terlebih dahulu.

### C. Melacak Kunjungan Toko (Geofencing GPS)
Untuk membuktikan bahwa Anda benar-benar berada di lokasi toko pelanggan:
1. Masuk ke menu **Kunjungan (Visits)**.
2. Pilih jadwal kunjungan hari ini, lalu klik **Check-In**.
3. Izinkan Browser untuk mengakses Lokasi/GPS Anda.
4. Sistem akan otomatis mencatat koordinat Anda saat itu juga.

---

## 4. MODUL ADMIN (UNTUK GUDANG & OPERASIONAL)

### A. Mengelola Master Produk
1. Buka menu **Master Produk**.
2. Untuk menambah 1 produk, klik **+ Tambah Produk Baru**. Isi SKU, Nama, Kategori, Harga Beli, Harga Jual.
3. **Konversi Satuan:** Pada form bagian bawah, klik *+ Tambah Konversi* untuk mengatur isi Dus. (Contoh: "Dari DUS, Qty 24, Ke PCS"). 
4. **Import Excel:** Untuk mengunggah ribuan barang sekaligus, gunakan tombol **Import Excel**. Pastikan Anda memakai Template Excel resmi yang disediakan sistem.

### B. Memproses Pesanan Sales
1. Buka menu **Daftar Pesanan**.
2. Anda akan melihat pesanan masuk dengan status `PENDING`.
3. Klik nomor invoice untuk melihat detail pesanan (Total stok yang dibutuhkan vs Stok Tersedia).
4. Jika stok cukup dan pembayaran DP sudah sesuai, ubah status menjadi **Selesai (COMPLETED)**.
5. **Penting:** Saat Anda menekan Selesai, stok fisik di gudang akan otomatis berkurang dengan sendirinya!

### C. Menambah Stok Gudang (Purchasing)
Jika barang habis, Anda harus memesan ke Supplier:
1. Buka menu **Pembelian (Purchase)**.
2. Buat *Purchase Order (PO)* baru. Masukkan jumlah dus yang dibeli.
3. Setelah barang fisik tiba di gudang dari Supplier, ubah status PO tersebut menjadi **COMPLETED**.
4. Sistem otomatis menambahkan stok ke produk terkait.

---

## 5. MODUL RETUR (PENGEMBALIAN BARANG)
Jika pelanggan mengembalikan barang karena rusak atau salah kirim:
1. Buka menu **Retur Barang**.
2. Buat transaksi Retur. Anda wajib memilih kondisi fisik barang:
   - **GOOD (Bagus):** Barang salah kirim tapi masih utuh. Stok utama akan ditambahkan kembali.
   - **BAD (Rusak):** Barang kedaluwarsa atau cacat. Barang akan masuk ke kategori *Bad Stock* dan tidak bisa dijual kembali.
3. Pilih Tipe Retur: *Exchange* (Tukar Barang) atau *Refund* (Uang Kembali).

---

## 6. KENDALA UMUM & SOLUSI
- **Error Lokasi GPS Tidak Ditemukan:** Pastikan fitur "Location Services" di HP Anda menyala, dan browser (Chrome/Safari) sudah diberikan izin lokasi pada menu Pengaturan HP.
- **Gagal Menurunkan Harga Jual:** Jika tombol Pengajuan Harga tidak bisa diklik, berarti Sales lupa mengisi kolom *Catatan / Alasan Penurunan Harga*.
- **Barang Tidak Muncul di Katalog Sales:** Pastikan Admin sudah mengatur Status Produk menjadi *Active* (bukan Draft/Review).

***
*Dokumen ini dicetak oleh Sistem Inventori DIA MAKMUR ABADI.*
