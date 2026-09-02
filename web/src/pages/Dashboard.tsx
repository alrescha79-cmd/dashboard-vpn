import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { Shield, ShoppingCart, Zap, Wallet, ArrowRight, Server } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ servers: any[] }>("/api/servers")
      .then((res) => setServers(res.servers))
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight text-kawaii-ink dark:text-white">
            Selamat Datang, {user ? user.display_name || user.username : "Pengguna"}
          </h1>
          <p className="text-neutral-700 dark:text-neutral-300 font-bold text-sm mt-1">
            Kelola akun VPN tunnel dan server Anda dengan mudah.
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Link
              to="/buy"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kawaii-peach hover:bg-kawaii-peachDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <ShoppingCart className="h-4 w-4 stroke-[2.5]" />
              <span>Buat Akun Baru</span>
            </Link>
            <Link
              to="/topup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kawaii-yellow hover:bg-kawaii-yellowDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Wallet className="h-4 w-4 stroke-[2.5]" />
              <span>Top Up Saldo</span>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/buy"
          className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark hover:-translate-y-1 hover:shadow-kawaii-pop dark:hover:shadow-kawaii-dark-pop transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="p-3.5 bg-kawaii-peach text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm w-fit">
              <ShoppingCart className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-lg text-kawaii-ink dark:text-white">Order VPN Premium</h2>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-relaxed">
              SSH, VMess, VLESS, Trojan, Shadowsocks, hingga bundle komplit 3IN1.
            </p>
          </div>
          <div className="flex items-center text-xs font-black text-kawaii-ink dark:text-white pt-5 group-hover:translate-x-1.5 transition-transform">
            <span>Beli Sekarang</span> <ArrowRight className="h-4 w-4 ml-1 stroke-[3]" />
          </div>
        </Link>

        <Link
          to="/trial"
          className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark hover:-translate-y-1 hover:shadow-kawaii-pop dark:hover:shadow-kawaii-dark-pop transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="p-3.5 bg-kawaii-yellow text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm w-fit">
              <Zap className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-lg text-kawaii-ink dark:text-white">Uji Coba Gratis (Trial)</h2>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Coba kecepatan dan konektivitas server secara gratis selama 60 menit.
            </p>
          </div>
          <div className="flex items-center text-xs font-black text-kawaii-ink dark:text-white pt-5 group-hover:translate-x-1.5 transition-transform">
            <span>Generate Akun Trial</span> <ArrowRight className="h-4 w-4 ml-1 stroke-[3]" />
          </div>
        </Link>

        <Link
          to="/my-accounts"
          className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark hover:-translate-y-1 hover:shadow-kawaii-pop dark:hover:shadow-kawaii-dark-pop transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="p-3.5 bg-kawaii-green text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm w-fit">
              <Shield className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h2 className="font-heading font-black text-lg text-kawaii-ink dark:text-white">Daftar Akunku</h2>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Akses konfigurasi, URL link impor v2ray, dan periksa masa aktif akun.
            </p>
          </div>
          <div className="flex items-center text-xs font-black text-kawaii-ink dark:text-white pt-5 group-hover:translate-x-1.5 transition-transform">
            <span>Lihat Akun</span> <ArrowRight className="h-4 w-4 ml-1 stroke-[3]" />
          </div>
        </Link>
      </div>

      {/* Available Servers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black font-heading text-kawaii-ink dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-kawaii-blue rounded-xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
              <Server className="h-5 w-5 text-kawaii-ink stroke-[2.5]" />
            </span>
            <span>Infrastruktur Server Aktif</span>
          </h2>
          <span className="text-xs font-black px-3.5 py-1 bg-kawaii-card dark:bg-kawaii-darkCard text-kawaii-ink dark:text-white rounded-full border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            Status Real-time
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center font-black text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark">
            Memeriksa ketersediaan server...
          </div>
        ) : servers.length === 0 ? (
          <div className="p-8 text-center font-black text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark">
            Belum ada server yang terdaftar di sistem.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servers.map((s) => {
              const isFull = s.total_create_akun >= s.batas_create_akun && s.batas_create_akun > 0;
              return (
                <div
                  key={s.id}
                  className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-heading font-black text-base text-kawaii-ink dark:text-white">{s.nama_server}</div>
                      <div className="text-xs font-mono font-black text-neutral-600 dark:text-neutral-400">{s.domain}</div>
                    </div>
                    <span
                      className={`text-xs px-3 py-0.5 rounded-full border-2 border-kawaii-ink dark:border-white font-black shadow-kawaii-sm ${
                        isFull ? "bg-kawaii-pink text-white" : "bg-kawaii-green text-kawaii-ink"
                      }`}
                    >
                      {isFull ? "Penuh" : "Tersedia"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-2 border-t-2 border-kawaii-ink/20 dark:border-white/20">
                    <div className="flex justify-between">
                      <span>Lokasi / ISP</span>
                      <span className="text-kawaii-ink dark:text-white font-black">{s.lokasi} - {s.isp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kapasitas Akun</span>
                      <span className="text-kawaii-ink dark:text-white font-black">
                        {s.total_create_akun} / {s.batas_create_akun || "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t-2 border-dashed border-kawaii-ink/30 dark:border-white/30">
                      <span>Tarif Layanan</span>
                      <span className="text-kawaii-ink font-black text-sm px-2.5 py-0.5 bg-kawaii-yellow rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
                        Rp {s.harga.toLocaleString("id-ID")}/hari
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
