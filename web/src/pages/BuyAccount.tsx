import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { AccountDetailsCard } from "../components/AccountDetailsCard";

export const BuyAccount: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState("vmess");
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ servers: any[] }>("/api/servers")
      .then((res) => {
        setServers(res.servers);
        if (res.servers.length > 0) setSelectedServer(res.servers[0].id);
      })
      .catch(() => setServers([]));
  }, []);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return setError("Silakan pilih server terlebih dahulu");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<any>("/api/accounts/buy", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer,
          protocol: selectedProtocol,
          username,
          password: selectedProtocol === "ssh" ? password : undefined,
          durationDays: duration
        })
      });
      setResult(res.account);
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentServerObj = servers.find((s) => s.id === selectedServer);
  let estimatedPrice = 0;
  if (currentServerObj && user) {
    let rate = 0;
    if (user.role === "reseller") {
      rate = user.reseller_level === "platinum" ? 0.3 : user.reseller_level === "gold" ? 0.2 : 0.1;
    }
    const mult = selectedProtocol === "3in1" ? 1.5 : 1;
    estimatedPrice = user.role === "admin" ? 0 : Math.floor(currentServerObj.harga * (1 - rate) * mult) * duration;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
          <span className="p-2 bg-kawaii-peach rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <ShoppingCart className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>Beli Akun VPN Premium</span>
        </h1>
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
          Pilih protokol, node server, dan atur durasi aktif yang diinginkan.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-kawaii dark:shadow-kawaii-dark flex items-center gap-3 text-sm font-black">
          <AlertCircle className="h-5 w-5 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
          <span>{error}</span>
        </div>
      )}

      {result ? (
        <div className="space-y-4">
          <AccountDetailsCard
            title="Akun VPN Berhasil Dibuat"
            headerTone="emerald"
            account={{
              username: result.username,
              protocol: result.protocol,
              expired_at: result.expired_at,
              credentials: result.credentials,
              links: result.links
            }}
            serverMeta={{
              domain: currentServerObj?.domain,
              nama_server: currentServerObj?.nama_server,
              lokasi: currentServerObj?.lokasi,
              isp: currentServerObj?.isp
            }}
          />
          <button
            onClick={() => {
              setResult(null);
              setUsername("");
              setPassword("");
            }}
            className="w-full py-3.5 bg-kawaii-peach hover:bg-kawaii-peachDark border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark rounded-3xl font-black text-sm text-kawaii-ink active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            Beli Akun Lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleBuy} className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 tracking-wider">
              1. Pilih Jenis Protokol
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: "ssh", name: "SSH & OpenVPN", badge: "Direct / WS" },
                { id: "vmess", name: "VMess", badge: "WS / gRPC" },
                { id: "vless", name: "VLESS", badge: "WS / TLS" },
                { id: "trojan", name: "Trojan", badge: "WS / gRPC" },
                { id: "shadowsocks", name: "Shadowsocks", badge: "AES-128" },
                { id: "3in1", name: "3IN1 Bundle", badge: "VMess+VLESS+Trojan" }
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedProtocol(p.id)}
                  className={`p-3.5 rounded-2xl border-3 text-left transition-all ${
                    selectedProtocol === p.id
                      ? "bg-kawaii-peach border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink scale-[1.02]"
                      : "bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-kawaii-ink/30 dark:border-white/30 text-neutral-800 dark:text-neutral-200 hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-card dark:hover:bg-kawaii-darkCard"
                  }`}
                >
                  <div className="font-heading font-black text-sm">{p.name}</div>
                  <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">{p.badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 tracking-wider">
              2. Pilih Node Server
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedServer(s.id)}
                  className={`p-4 rounded-2xl border-3 cursor-pointer transition-all ${
                    selectedServer === s.id
                      ? "bg-kawaii-blue border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink scale-[1.01]"
                      : "bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-kawaii-ink/30 dark:border-white/30 text-neutral-800 dark:text-neutral-200 hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-card dark:hover:bg-kawaii-darkCard"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-heading font-black text-sm">{s.nama_server}</div>
                    <span className="text-xs font-black px-2 py-0.5 bg-kawaii-green text-kawaii-ink rounded-md border-2 border-kawaii-ink dark:border-white">
                      Rp {s.harga.toLocaleString("id-ID")}/hr
                    </span>
                  </div>
                  <div className="text-xs font-mono font-black text-neutral-700 dark:text-neutral-300 mt-1">{s.domain}</div>
                  <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-2">
                    {s.lokasi} • Kuota: {s.total_create_akun}/{s.batas_create_akun || "Unlimited"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Username VPN
              </label>
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9]+$"
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-sm font-black text-kawaii-ink dark:text-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm focus:outline-none focus:bg-kawaii-yellow/20"
                placeholder="Hanya huruf & angka (3-20 karakter)"
              />
            </div>
            {selectedProtocol === "ssh" && (
              <div>
                <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Password SSH
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-sm font-black text-kawaii-ink dark:text-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm focus:outline-none focus:bg-kawaii-yellow/20"
                  placeholder="Password akun SSH"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 tracking-wider">
              3. Durasi Masa Aktif
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[7, 15, 30, 60].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-2xl border-3 text-center font-black text-sm transition-all ${
                    duration === d
                      ? "bg-kawaii-yellow border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink scale-[1.03]"
                      : "bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-kawaii-ink/30 dark:border-white/30 text-neutral-800 dark:text-neutral-200 hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-card dark:hover:bg-kawaii-darkCard"
                  }`}
                >
                  {d} Hari
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 bg-kawaii-subtle dark:bg-kawaii-darkSubtle rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm space-y-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-neutral-700 dark:text-neutral-300">Total Biaya Pembelian:</span>
              <span className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">
                Rp {estimatedPrice.toLocaleString("id-ID")}
              </span>
            </div>
            <button
              type="submit"
              disabled={loading || !user || user.saldo < estimatedPrice}
              className="w-full py-3.5 bg-kawaii-green hover:bg-kawaii-greenDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-500 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {loading
                ? "Membuat Akun VPN..."
                : !user
                  ? "Silakan Login Terlebih Dahulu"
                  : user.saldo < estimatedPrice
                    ? "Saldo Anda Tidak Mencukupi (Silakan Top Up)"
                    : "Konfirmasi & Bayar Sekarang"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
