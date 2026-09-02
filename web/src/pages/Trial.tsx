import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Zap, AlertCircle, LogIn, UserPlus, Shield } from "lucide-react";
import { AccountDetailsCard } from "../components/AccountDetailsCard";

export const Trial: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState("vmess");
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [username, setUsername] = useState(`trial${Math.floor(1000 + Math.random() * 9000)}`);
  const [password, setPassword] = useState("123456");
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

  const handleTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return setError("Silakan pilih server terlebih dahulu");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<any>("/api/accounts/trial", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer,
          protocol: selectedProtocol,
          username,
          password: selectedProtocol === "ssh" ? password : undefined
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

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
          <span className="p-2 bg-kawaii-yellow rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Zap className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>Generate Akun Trial Gratis</span>
        </h1>
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
          Coba koneksi server VPN secara gratis dengan masa aktif 1 jam (60 menit).
        </p>
      </div>

      {!user ? (
        /* Guest Login Required Notice Card */
        <div className="p-6 md:p-8 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii-pop dark:shadow-kawaii-dark-pop space-y-5 text-center max-w-2xl mx-auto">
          <div className="inline-flex p-4 bg-kawaii-yellow text-kawaii-ink rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-10 w-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black font-heading text-kawaii-ink dark:text-white">
              Silakan Masuk Untuk Mendapatkan Akun Trial
            </h2>
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 max-w-md mx-auto">
              Setiap pengguna terdaftar mendapatkan jatah trial gratis 1 jam per hari untuk menguji performa dan latensi server kami.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-kawaii-peach hover:bg-kawaii-peachDark font-black text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <LogIn className="h-4 w-4 stroke-[2.5]" />
              <span>Masuk Sekarang</span>
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-kawaii-subtle dark:bg-kawaii-darkSubtle hover:bg-white font-black text-sm text-kawaii-ink dark:text-white border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <UserPlus className="h-4 w-4 stroke-[2.5]" />
              <span>Daftar Gratis</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-kawaii dark:shadow-kawaii-dark flex items-center gap-3 text-sm font-black">
              <AlertCircle className="h-5 w-5 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <AccountDetailsCard
                title="Akun Trial Anda Aktif!"
                headerTone="amber"
                account={{
                  username: result.username,
                  protocol: result.protocol,
                  expired_at: result.expired_at,
                  credentials: result.credentials,
                  links: result.links
                }}
                serverMeta={{
                  domain: servers.find((s) => s.id === selectedServer)?.domain,
                  nama_server: servers.find((s) => s.id === selectedServer)?.nama_server,
                  lokasi: servers.find((s) => s.id === selectedServer)?.lokasi,
                  isp: servers.find((s) => s.id === selectedServer)?.isp
                }}
              />
              <button
                onClick={() => {
                  setResult(null);
                  setUsername(`trial${Math.floor(1000 + Math.random() * 9000)}`);
                }}
                className="w-full py-3.5 bg-kawaii-yellow hover:bg-kawaii-yellowDark border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark rounded-3xl font-black text-sm text-kawaii-ink active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleTrial} className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 tracking-wider">
                  1. Pilih Protokol Trial
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {["ssh", "vmess", "vless", "trojan", "shadowsocks"].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setSelectedProtocol(p)}
                      className={`p-3 rounded-2xl border-3 text-center uppercase font-black text-sm transition-all ${
                        selectedProtocol === p
                          ? "bg-kawaii-yellow border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink scale-[1.03]"
                          : "bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-kawaii-ink/30 dark:border-white/30 text-neutral-800 dark:text-neutral-200 hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-card dark:hover:bg-kawaii-darkCard"
                      }`}
                    >
                      {p}
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
                      <div className="font-heading font-black text-sm">{s.nama_server}</div>
                      <div className="text-xs font-mono font-black text-neutral-700 dark:text-neutral-300 mt-1">{s.domain}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Username Trial
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-sm font-black text-kawaii-ink dark:text-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm focus:outline-none focus:bg-kawaii-yellow/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || servers.length === 0}
                className="w-full py-3.5 bg-kawaii-yellow hover:bg-kawaii-yellowDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-500 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {loading ? "Menyiapkan Akun Trial..." : "Dapatkan Trial Gratis Sekarang"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};
