# FutsalTix Cianjur — Frontend Ecosystem

Frontend resmi platform pemesanan tiket turnamen futsal pelajar (SMP & SMA/SMK) di **Gelanggang Generasi Muda (GGM) Cianjur**. Dibuat menggunakan **React 19**, **Vite**, dan **Tailwind CSS v4** dengan gaya desain **Neo-Brutalist Sports Editorial**.

---

## ⚽ Fitur & Halaman yang Tersedia

### 1. Public Landing Page (`/`)
- **Hero Section**: Judul turnamen, informasi venue resmi GGM Cianjur, jaminan *Held-Quota* 10 menit, dan sistem tiket digital *anti-calo*.
- **Pencarian & Filter Jadwal**: Pencarian instan berdasarkan nama sekolah / tim serta tab filter kategori (Semua, SMA/SMK, SMP).
- **Match Cards**: Menampilkan nama tim vs seed, tanggal, jam kickoff, gelanggang (Court A/B), harga tiket, dan badge sisa kuota (merah saat <= 30 tiket).
- **Simulasi Pemesanan**: Modal konfirmasi pemesanan tiket dengan estimasi waktu pembayaran sebelum diarahkan ke halaman Tiket Saya.

### 2. Autentikasi Suporter
- **Halaman Pendaftaran (`/daftar`)**: Form registrasi akun penonton resmi dengan validasi interaktif di sisi klien (Nama min. 3 karakter, format email valid, no. WhatsApp 10-13 digit, kata sandi min. 8 karakter dengan tombol toggle show/hide, dan persetujuan tata tertib GGM).
- **Halaman Masuk (`/masuk`)**: Form login dengan enkripsi sesi tiket turnstile.

### 3. Tiket Saya & Modal E-Ticket (`/tiket`)
- **Daftar Tiket Pengguna**: Menampilkan tiket dengan status *SIAP SCAN* (Aktif) dan *TELAH DIGUNAKAN* (Riwayat).
- **Modal E-Ticket (QR Code)**:
  - Popup modal neo-brutalist dengan latar *backdrop blur*.
  - **Vektor SVG QR Code**: Tajam, responsif, tidak terpotong di layar HP, dan mudah dipindai mesin gate turnstile.
  - **Kode Masuk Mandiri**: Dilengkapi tombol **Salin Kode (Copy to Clipboard)** dengan umpan balik visual instan.
  - Rincian pintu gerbang masuk (*Gate A Barat / Gate B Timur*), waktu kickoff, dan nama pemegang tiket.

### 4. Panel Admin GGM (`/admin`)
- **Persetujuan Akun Operator**: Tabel persetujuan panitia scanner gate dengan filter status dan aksi interaktif **Setujui (Approve)** dan **Tolak (Reject)** secara real-time.
- **Kelola Kuota Pertandingan**: Ringkasan statistik kuota total vs tiket terjual, progress bar keterisian tribun, serta form inline untuk mengedit kuota tiket, harga, dan status pembukaan gate per laga.

### 5. Tampilan Operator Scanner Lapangan (`/operator`)
- **Viewfinder Kamera**: Reticle target dengan animasi garis laser pemindai (*laser scan beam*).
- **Pilihan Pintu Masuk**: Pengalihan gate (*Gate A Barat, Gate B Timur, Gate C VIP*).
- **Uji Simulasi Respons Status**:
  - **Modal Valid (Hijau `#15803D`)**: Status `#OK-200`, Turnstile 01 Unlocked, nama penonton, sekolah, dan simulasi suara beep.
  - **Modal Duplikat / Gagal (Merah `#DC2626`)**: Status `#ERR-409`, Security Alert Access Denied, peringatan pembajakan tiket terpakai sebelumnya, serta rekomendasi penanganan petugas lapangan.

---

## 📱 Responsivitas Mobile-First
- **Desktop**: Bilah navigasi lengkap dengan tautan halaman dan tombol aksi masuk/daftar.
- **Mobile (< 768px)**: 
  - Hamburger Menu dengan drawer slide-down untuk menu utama.
  - **Bottom Navigation Bar** yang selalu menempel di bagian bawah layar untuk navigasi satu tangan (*thumb-friendly*).
  - Skala modal QR code fleksibel sehingga tidak terpotong di layar kecil.

---

## 🛠️ Menjalankan Proyek Secara Lokal

1. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```

2. Instal dependensi (jika baru pertama kali):
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```

4. Buka peramban di `http://localhost:5173`.

5. Melakukan Build Produksi:
   ```bash
   npm run build
   ```

---

## 📂 Struktur Berkas Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx      # Bilah navigasi bawah untuk layar mobile
│   │   ├── ETicketModal.jsx   # Modal popup QR Code E-Ticket Neo-Brutalist
│   │   ├── Footer.jsx         # Footer aplikasi dan informasi GGM
│   │   ├── MatchCard.jsx      # Kartu jadwal pertandingan futsal
│   │   └── Navbar.jsx         # Header navbar dengan mobile hamburger drawer
│   ├── data/
│   │   ├── mockData.js        # Data tiruan (jadwal, tiket suporter, akun operator)
│   │   └── matches.js         # Re-export data untuk kompatibilitas
│   ├── pages/
│   │   ├── AdminDashboard.jsx # Panel admin (persetujuan operator & kuota laga)
│   │   ├── Home.jsx           # Public landing page jadwal futsal Cianjur
│   │   ├── Login.jsx          # Formulir login suporter
│   │   ├── OperatorScanner.jsx# Scanner gate turnstile & modal valid/invalid
│   │   ├── Register.jsx       # Formulir registrasi penonton dengan validasi
│   │   └── TiketSaya.jsx      # Dompet e-tiket dan daftar tiket terbeli
│   ├── App.jsx                # Router utama aplikasi
│   ├── index.css              # Konfigurasi Tailwind CSS v4 & custom keyframes
│   └── main.jsx               # Entry point aplikasi React
└── index.html                 # Template HTML utama dengan font Google
```
