# VPN Web Dashboard

Dashboard manajemen dan penjualan akun VPN Tunnel Multi-Protokol modern berbasis **Bun**, **Elysia.js**, **SQLite**, dan **React Tailwind (Kawaii Pop UI)**. Mendukung otomasi multi-server node VPN via SSH, multi payment gateway, bot notifikasi Telegram, sistem reseller komisi saldo, dan manajemen akun trial instan.

---

## Fitur Utama

- **Multi-Protokol Lengkap**:
  - SSH / OpenVPN (Direct, WebSocket, SSL)
  - V2Ray VMess (WebSocket, gRPC, TLS)
  - V2Ray VLESS (WebSocket, TLS, XTLS)
  - Trojan (WebSocket, TLS, gRPC)
  - Shadowsocks (AES-128-GCM / 2022)
  - Paket Bundle 3IN1 (VMess + VLESS + Trojan)
- **Akun Trial 1 Jam Gratis**: Pengguna terdaftar dapat menguji koneksi dan kecepatan server secara gratis dengan masa aktif tepat 60 menit.
- **Multi Payment Gateway & Top Up Otomatis**:
  - Tripay (Closed Payment / QRIS / VA)
  - Duitku
  - Pakasir
  - Midtrans Snap
  - Static QRIS Dinamis (NMID String)
- **Sistem Reseller & Komisi**:
  - Upgrade level member (Silver, Gold, Platinum) dengan diskon harga khusus per transaksi.
- **Manajemen Server Node Dinamis**:
  - Tambah, monitor kuota akun, tes latensi koneksi SSH, reboot node, dan hapus akun otomatis via cron.
- **Notifikasi Bot Telegram**:
  - Notifikasi instan untuk pembelian akun, perpanjangan, top up saldo berhasil, dan pembuatan akun trial.
- **UI Responsif Kawaii Pop**:
  - Desain modern bertema Kawaii Pop dengan border tegas (3-4px), shadow pop, dark mode switch, dan mobile floating dock navigation.
  - Proteksi tamu (guest view) yang membatasi metrik finansial/sistem internal.

---

## Struktur Direktori

```text
├── src/
│   ├── config.ts              # Konfigurasi environment & dynamic DB settings
│   ├── index.ts               # Entrypoint HTTP server Elysia & static web provider
│   ├── cron/                  # Cron jobs (penghapusan akun kedaluwarsa & sweep deposit)
│   ├── db/                    # SQLite database schema, koneksi, & seed admin
│   ├── lib/                   # Autentikasi JWT, password hasher, SSH client
│   ├── modules/
│   │   ├── payments/          # Handler Tripay, Duitku, Pakasir, Midtrans, Static QRIS
│   │   ├── protocols/         # Generator script multi-protokol (VMess, VLESS, SSH, dll)
│   │   ├── services/          # Business logic akun, perpanjangan, dan saldo
│   │   └── telegram/          # Bot Telegram & format notifikasi
│   └── routes/                # Endpoint REST API backend
├── web/                       # Frontend SPA (React + TypeScript + Vite + Tailwind CSS)
├── docs/                      # Dokumentasi teknis & deployment VPS
├── Dockerfile                 # Multi-stage production build (Bun + Vite)
├── docker-compose.yml         # Konfigurasi Docker container lokal & VPS
└── package.json
```

---

## Panduan Instalasi Cepat (Local Development)

### 1. Prasyarat
- [Bun](https://bun.sh) versi >= 1.2
- Node.js (opsional jika menggunakan Bun sebagai runtime utama)

### 2. Kloning Repository
```bash
git clone https://github.com/alrescha79-cmd/dashboard-vpn.git
cd dashboard-vpn
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan parameter utama (seperti `JWT_SECRET`, `PORT`, atau bot token Telegram).

### 4. Instalasi Dependensi
```bash
# Install dependensi backend
bun install

# Install dependensi frontend
cd web && bun install && cd ..
```

### 5. Menjalankan Aplikasi
```bash
# Terminal 1: Jalankan backend server
bun run dev

# Terminal 2: Jalankan frontend development (Vite)
cd web && bun run dev
```

Dashboard backend dapat diakses di `http://localhost:3000` dan frontend dev di `http://localhost:5173`.

### 6. Menjalankan Unit Test
```bash
bun test
```

---

## Menjalankan Menggunakan Docker

Anda dapat langsung menjalankan aplikasi secara lokal menggunakan Docker Compose:

```bash
# 1. Pastikan file .env sudah siap
cp .env.example .env

# 2. Build dan jalankan container
docker compose up -d --build

# 3. Periksa status log container
docker compose logs -f
```

Buka peramban di `http://localhost:3000`.

### Kredensial Administrator Awal
- **Username**: `admin`
- **Password**: `AdminPassword123!`

*Catatan: Pada saat login pertama kali, sistem akan mengarahkan Anda ke halaman `/setup` untuk mengganti username & password administrator baru.*

---

## Dokumentasi Deployment ke VPS

Untuk panduan lengkap deployment ke VPS Ubuntu / Debian menggunakan Docker image resmi dari GitHub Container Registry (`ghcr.io`), konfigurasi Reverse Proxy (Nginx / Caddy), dan SSL HTTPS otomatis, silakan baca:

**[Panduan Lengkap Deployment VPS (docs/DEPLOYMENT_VPS.md)](docs/DEPLOYMENT_VPS.md)**

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
