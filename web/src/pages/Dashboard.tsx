import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  Shield,
  ShoppingCart,
  Zap,
  Wallet,
  ArrowRight,
  Server,
  Users,
  Activity,
  BarChart3,
  Layers,
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  Globe,
  Radio
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises: Promise<any>[] = [apiFetch<{ servers: any[] }>("/api/servers")];
    if (user) {
      promises.push(apiFetch<{ stats: any }>("/api/admin/stats/overview"));
    }

    Promise.allSettled(promises)
      .then(([serversRes, statsRes]) => {
        if (serversRes && serversRes.status === "fulfilled") setServers(serversRes.value.servers || []);
        if (statsRes && statsRes.status === "fulfilled") setStats(statsRes.value.stats || null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Compute max values for SVG Chart normalization (logged-in only)
  const trendData = stats?.trend || [];
  const maxAccounts = Math.max(...trendData.map((t: any) => t.accounts), 5);

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Welcome / Header */}
      {user ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight text-kawaii-ink dark:text-white">
              Selamat Datang, {user.display_name || user.username}
            </h1>
            <p className="text-neutral-700 dark:text-neutral-300 font-bold text-sm mt-1">
              Kelola akun VPN tunnel, monitor node server, dan pantau performa akun Anda.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/buy"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kawaii-peach hover:bg-kawaii-peachDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <ShoppingCart className="h-4 w-4 stroke-[2.5]" />
              <span>Buat Akun</span>
            </Link>
            <Link
              to="/topup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-kawaii-yellow hover:bg-kawaii-yellowDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Wallet className="h-4 w-4 stroke-[2.5]" />
              <span>Top Up</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Guest Welcome & Login Prompt Banner */
        <div className="p-6 md:p-8 bg-kawaii-yellow/30 dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii-pop dark:shadow-kawaii-dark-pop space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-kawaii-yellow text-kawaii-ink font-black text-xs rounded-full border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm">
                <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Layanan VPN Tunnel Premium Cepat & Stabil</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-heading text-kawaii-ink dark:text-white leading-tight">
                Akses Internet Bebas Batas & Privasi Terjaga
              </h1>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Silakan masuk atau buat akun baru untuk mulai order akun VPN (SSH, VMess, VLess, Trojan, Shadowsocks) atau nikmati akun trial gratis selama 1 jam.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-kawaii-peach hover:bg-kawaii-peachDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <LogIn className="h-4 w-4 stroke-[2.5]" />
                <span>Masuk Akun</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-kawaii-card dark:bg-kawaii-darkSubtle hover:bg-white font-black text-sm text-kawaii-ink dark:text-white border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <UserPlus className="h-4 w-4 stroke-[2.5]" />
                <span>Daftar Gratis</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Metric Cards (Visible only to logged in users, or public overview for guests) */}
      {user ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-black uppercase text-neutral-600 dark:text-neutral-400">
                {user.role === "admin" ? "Total Akun Aktif" : "Akun Aktif Anda"}
              </span>
              <span className="p-2 bg-kawaii-blue rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
                <Shield className="h-4 w-4 stroke-[2.5]" />
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black font-heading text-kawaii-ink dark:text-white">
              {stats ? stats.accountsCount : "—"}
            </div>
            <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Tunnel aktif di VPS</p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-black uppercase text-neutral-600 dark:text-neutral-400">
                Node Server
              </span>
              <span className="p-2 bg-kawaii-yellow rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
                <Server className="h-4 w-4 stroke-[2.5]" />
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black font-heading text-kawaii-ink dark:text-white">
              {stats ? stats.serversCount : servers.length}
            </div>
            <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Infrastruktur online</p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-black uppercase text-neutral-600 dark:text-neutral-400">
                {user.role === "admin" ? "Volume Transaksi" : "Total Saldo Masuk"}
              </span>
              <span className="p-2 bg-kawaii-green rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
                <Wallet className="h-4 w-4 stroke-[2.5]" />
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black font-heading text-kawaii-ink dark:text-white truncate">
              Rp {stats ? Number(stats.depositVolume).toLocaleString("id-ID") : "0"}
            </div>
            <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Status terverifikasi</p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-black uppercase text-neutral-600 dark:text-neutral-400">
                {user.role === "admin" ? "Total Pengguna" : "Saldo Dompet"}
              </span>
              <span className="p-2 bg-kawaii-pink rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-white">
                {user.role === "admin" ? <Users className="h-4 w-4 stroke-[2.5]" /> : <Activity className="h-4 w-4 stroke-[2.5]" />}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black font-heading text-kawaii-ink dark:text-white">
              {user.role === "admin" ? stats?.usersCount || "—" : `Rp ${(user.saldo || 0).toLocaleString("id-ID")}`}
            </div>
            <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              {user.role === "admin" ? "Member terdaftar" : "Siap digunakan"}
            </p>
          </div>
        </div>
      ) : (
        /* Guest Feature Overview Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="p-2 bg-kawaii-peach w-fit rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
              <Radio className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="text-base font-black font-heading text-kawaii-ink dark:text-white">
              Multi Protokol
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Mendukung VMess, VLess, Trojan, Shadowsocks, & SSH SSL.
            </p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="p-2 bg-kawaii-yellow w-fit rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
              <Zap className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="text-base font-black font-heading text-kawaii-ink dark:text-white">
              Trial 1 Jam Gratis
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Uji coba kualitas dan kecepatan koneksi sebelum berlangganan.
            </p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="p-2 bg-kawaii-green w-fit rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
              <Wallet className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="text-base font-black font-heading text-kawaii-ink dark:text-white">
              Otomatis QRIS & Bank
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Top up saldo instan 24 jam via Tripay, Duitku, Pakasir, Midtrans, & QRIS.
            </p>
          </div>

          <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-2">
            <div className="p-2 bg-kawaii-blue w-fit rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
              <Globe className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="text-base font-black font-heading text-kawaii-ink dark:text-white">
              Node Server Luas
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Pilihan lokasi server dengan latensi rendah dan bandwidth besar.
            </p>
          </div>
        </div>
      )}

      {/* Visual Charts & Graphs Section (Logged In Users Only) */}
      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Bar Chart */}
          <div className="lg:col-span-2 p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-4">
            <div className="flex items-center justify-between border-b-2 border-kawaii-ink/20 dark:border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-kawaii-yellow rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
                  <BarChart3 className="h-4 w-4 stroke-[2.5]" />
                </span>
                <h2 className="font-heading font-black text-lg text-kawaii-ink dark:text-white">
                  Trend Aktivitas 7 Hari Terakhir
                </h2>
              </div>
              <span className="text-xs font-black px-3 py-0.5 bg-kawaii-subtle dark:bg-kawaii-darkSubtle rounded-full border-2 border-kawaii-ink dark:border-white text-kawaii-ink dark:text-white">
                Akun Dibuat
              </span>
            </div>

            <div className="h-52 w-full flex items-end justify-between gap-2 pt-4 px-2">
              {trendData.map((item: any, idx: number) => {
                const heightPct = Math.max(Math.round((item.accounts / maxAccounts) * 100), 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-black text-kawaii-ink dark:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-kawaii-peach px-2 py-0.5 rounded-lg border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm">
                      {item.accounts}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[42px] bg-kawaii-peach hover:bg-kawaii-peachDark border-3 border-kawaii-ink dark:border-white rounded-2xl shadow-kawaii-sm transition-all group-hover:scale-105"
                    />
                    <span className="text-[11px] font-black text-neutral-600 dark:text-neutral-400 mt-1">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protocol Distribution Graph */}
          <div className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-kawaii-ink/20 dark:border-white/20 pb-3">
              <span className="p-1.5 bg-kawaii-green rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
                <Layers className="h-4 w-4 stroke-[2.5]" />
              </span>
              <h2 className="font-heading font-black text-lg text-kawaii-ink dark:text-white">
                Distribusi Protokol
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {stats?.protocols && stats.protocols.length > 0 ? (
                stats.protocols.map((p: any, idx: number) => {
                  const total = stats.accountsCount || 1;
                  const pct = Math.round((p.count / total) * 100);
                  const colors = ["bg-kawaii-yellow", "bg-kawaii-peach", "bg-kawaii-blue", "bg-kawaii-green", "bg-kawaii-pink"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={p.protocol} className="space-y-1">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-kawaii-ink dark:text-white">{p.protocol}</span>
                        <span className="text-neutral-600 dark:text-neutral-400">{p.count} akun ({pct}%)</span>
                      </div>
                      <div className="w-full h-3.5 bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-2 border-kawaii-ink dark:border-white rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(pct, 5)}%` }}
                          className={`h-full ${color} border-r-2 border-kawaii-ink dark:border-white transition-all`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs font-bold text-neutral-500 text-center py-8">
                  Belum ada data distribusi akun VPN.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              Coba kecepatan dan konektivitas server secara gratis selama 1 jam (60 menit).
            </p>
          </div>
          <div className="flex items-center text-xs font-black text-kawaii-ink dark:text-white pt-5 group-hover:translate-x-1.5 transition-transform">
            <span>Generate Akun Trial</span> <ArrowRight className="h-4 w-4 ml-1 stroke-[3]" />
          </div>
        </Link>

        <Link
          to={user ? "/my-accounts" : "/login"}
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
            <span>{user ? "Lihat Akun" : "Masuk Akun"}</span> <ArrowRight className="h-4 w-4 ml-1 stroke-[3]" />
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
