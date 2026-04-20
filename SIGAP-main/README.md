# 🚀 SIGAP - Sistem Informasi Gerak Alur Proposal

**SIGAP** adalah platform monitoring dashboard modern yang dirancang untuk mengelola, melacak, dan memverifikasi alur pengajuan proposal secara sistematis dan transparan. Dibangun dengan kombinasi teknologi terbaik untuk memberikan pengalaman pengguna yang responsif dan visualisasi data yang memukau.

---

## ✨ Fitur Utama

- **📊 Dashboard Interaktif**: Visualisasi data real-time menggunakan Recharts (Donut & Bar Charts).
- **📋 Manajemen Proposal**: Pengajuan, pelacakan status, dan revisi proposal dalam satu tempat.
- **📍 Timeline Tracking**: Pantau progres proposal Anda langkah demi langkah dengan indikator visual yang jelas.
- **📤 Verifikasi Multi-Dokumen**: Dukungan upload file proposal, bukti transfer, hingga dokumen LPJ (Evidence).
- **💬 Notifikasi WhatsApp**: Integrasi *Click-to-Chat / Event-Driven* otomatis untuk memberitahu pemohon setiap kali status proposal berubah.
- **👥 Multi-Role Akses**: Sistem otentikasi untuk Super Admin, Admin Reviewer, dan User/Pemohon.
- **📈 Ekspor Data**: Unduh laporan proposal dalam format CSV untuk kebutuhan audit.
- **📱 Responsive Design**: Optimal digunakan di desktop maupun perangkat mobile.

---

## 🛠️ Tech Stack

- **Backend**: [Laravel 10](https://laravel.com/) (PHP 8.1+)
- **Frontend**: [React JS](https://reactjs.org/) & [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: MySQL / MariaDB

---

## ⚙️ Panduan Instalasi (Clone Project)

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini di komputer lokal Anda:

### 1. Persyaratan Sistem
- PHP >= 8.1
- Composer
- Node.js & NPM
- Web Server (Laragon direkomendasikan untu Windows)

### 2. Langkah-Langkah

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/admin_dashboard_laravel.git
    cd admin_dashboard_laravel
    ```

2.  **Instalasi Dependencies Backend**
    ```bash
    composer install
    ```

3.  **Instalasi Dependencies Frontend**
    ```bash
    npm install
    ```

4.  **Konfigurasi Environment**
    Salin file `.env.example` menjadi `.env`:
    ```bash
    cp .env.example .env
    ```
    Buka file `.env` dan sesuaikan konfigurasi database Anda.

5.  **Generate App Key**
    ```bash
    php artisan key:generate
    ```

6.  **Migrasi & Sinkronisasi Database**
    Jalankan perintah ini untuk membuat struktur tabel dan mengisi data awal (dummy users & roles):
    ```bash
    php artisan migrate:fresh --seed
    ```

7.  **Link Storage** (Untuk upload file)
    ```bash
    php artisan storage:link
    ```

8.  **Jalankan Aplikasi**
    Buka dua terminal berbeda:
    - **Terminal 1 (Backend)**: `php artisan serve`
    - **Terminal 2 (Frontend)**: `npm run dev`

9.  **Akses Aplikasi**
    Buka browser dan akses alamat yang muncul di terminal (biasanya `http://localhost:8000`).

---

## 📸 Tampilan Dashboard

*Aplikasi ini dilengkapi dengan desain premium:*
- **Stat Cards**: Desain pastel minimalis dengan ikon squircle.
- **Charts**: Gradasi vertikal pada Bar Chart dan Donut Chart dengan rounded corners.
- **Glassmorphism**: Efek transparansi pada elemen UI tertentu untuk kesan mewah.

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda memiliki ide atau perbaikan, silakan buat *Pull Request* atau ajukan *Issue*.

---

> 2k26 Built with ❤️