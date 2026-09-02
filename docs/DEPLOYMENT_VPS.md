# Panduan Deployment VPN Dashboard ke VPS

Panduan ini menjelaskan langkah demi langkah cara men-deploy **VPN Web Dashboard** di server VPS (Ubuntu 22.04 / 24.04 atau Debian 11 / 12) menggunakan Docker Image dari GitHub Container Registry (`ghcr.io`), dilengkapi dengan konfigurasi Nginx Reverse Proxy dan SSL HTTPS otomatis dari Let's Encrypt.

---

## 1. Persiapan VPS

### Spesifikasi Minimum Server
- **CPU**: 1 vCPU
- **RAM**: 1 GB RAM (direkomendasikan 2 GB)
- **Disk**: 15 GB SSD
- **OS**: Ubuntu 22.04 / 24.04 LTS atau Debian 11 / 12
- **Domain**: Sudah diarahkan (DNS A Record) ke alamat IP Public VPS Anda (misal: `vpn.domainanda.com`).

---

## 2. Instalasi Docker & Docker Compose di VPS

Hubungkan terminal Anda ke VPS via SSH:
```bash
ssh root@IP_VPS_ANDA
```

Jalankan skrip instalasi resmi Docker:
```bash
# Update repository
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Setup repository Docker
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verifikasi instalasi
docker --version
docker compose version
```

---

## 3. Menyiapkan Direktori & Konfigurasi Deployment

Buat direktori khusus untuk aplikasi di `/opt/vpn-dashboard`:
```bash
mkdir -p /opt/vpn-dashboard/data
cd /opt/vpn-dashboard
```

### A. Buat File `docker-compose.yml`
Buat file `docker-compose.yml`:
```bash
nano docker-compose.yml
```

Tempel konfigurasi berikut (ganti `alrescha79-cmd/dashboard-vpn` jika menggunakan repository Anda):
```yaml
services:
  vpn-dashboard:
    image: ghcr.io/alrescha79-cmd/dashboard-vpn:latest
    container_name: vpn-dashboard
    restart: always
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_PATH=/app/data/vpn.db
```

### B. Buat File `.env`
Buat file `.env`:
```bash
nano .env
```

Isi dengan variabel konfigurasi produksi Anda:
```env
PORT=3000
NODE_ENV=production
DB_PATH=/app/data/vpn.db

# Wajib: Ganti dengan string acak yang panjang dan aman
JWT_SECRET=BuatStringRahasiaSangatPanjangDanAcak1234567890!

# Identitas Toko & URL Publik
NAMA_STORE=VPN Premium Store
PUBLIC_BASE_URL=https://vpn.domainanda.com

# Notifikasi Bot Telegram (Opsional tapi direkomendasikan)
BOT_TOKEN=123456789:AAXXXXXXXXXXXXXX
GROUP_ID=-100123456789
ADMIN_IDS=12345678,87654321

# Payment Gateway (Bisa juga dikonfigurasi melalui Admin Web UI di /admin/settings)
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
TRIPAY_ENV=production

DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_ENV=production

PAKASIR_PROJECT=
PAKASIR_API_KEY=

MIDTRANS_MERCHANT_ID=
MIDTRANS_SERVER_KEY=
MIDTRANS_ENV=production

DATA_QRIS=
```

---

## 4. Menjalankan Container

Tarik image terbaru dari GitHub Container Registry dan jalankan:
```bash
# Pull docker image terbaru
docker compose pull

# Jalankan container di latar belakang (daemon)
docker compose up -d

# Cek apakah container berjalan normal
docker compose ps
docker compose logs -f
```

---

## 5. Konfigurasi Nginx Reverse Proxy & SSL Let's Encrypt

Agar dashboard dapat diakses menggunakan nama domain Anda dengan protokol HTTPS yang aman:

### A. Install Nginx & Certbot
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### B. Konfigurasi Virtual Host Nginx
Buat file konfigurasi Nginx:
```bash
sudo nano /etc/nginx/sites-available/vpn-dashboard
```

Tempel konfigurasi berikut (ganti `vpn.domainanda.com` dengan domain Anda):
```nginx
server {
    listen 80;
    server_name vpn.domainanda.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan virtual host dan reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/vpn-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### C. Pasang Sertifikat SSL Gratis (Let's Encrypt)
```bash
sudo certbot --nginx -d vpn.domainanda.com
```
Ikuti instruksi di layar, masukkan email Anda dan pilih opsi redirect HTTP ke HTTPS otomatis.

---

## 6. Login Pertama & Inisialisasi Administrator

1. Buka browser dan kunjungi: `https://vpn.domainanda.com`
2. Klik tombol **Masuk Akun**.
3. Gunakan kredensial bawaan:
   - **Username**: `admin`
   - **Password**: `AdminPassword123!`
4. Sistem akan otomatis meminta Anda membuat username dan password baru di halaman `/setup`.
5. Masuk ke menu **Pengaturan Sistem** (`/admin/settings`) untuk mengaktifkan payment gateway dan token bot Telegram Anda.

---

## 7. Menghubungkan Server Node VPN

Untuk mulai menjual akun VPN:
1. Masuk ke menu **Kelola Server** (`/admin/servers`).
2. Klik **Tambah Server Baru**.
3. Masukkan domain / IP server node VPN, port SSH (default: 22), user SSH (default: `root`), dan metode otentikasi (Password / SSH Private Key).
4. Klik **Simpan Server**. Dashboard akan otomatis mengeksekusi script protokol ke server node saat ada order akun baru.

---

## 8. Panduan Pemeliharaan (Maintenance)

### A. Cara Update ke Versi Terbaru
Ketika ada update baru yang telah dipush ke repository GitHub:
```bash
cd /opt/vpn-dashboard
docker compose pull
docker compose up -d
```

### B. Backup Database SQLite
Seluruh data akun, saldo, pengguna, dan transaksi tersimpan aman di direktori persisten `./data/vpn.db`.
Untuk mencadangkan database:
```bash
cp /opt/vpn-dashboard/data/vpn.db /root/vpn_backup_$(date +%F).db
```

### C. Melihat Log Real-time
```bash
cd /opt/vpn-dashboard
docker compose logs -f --tail=100
```
