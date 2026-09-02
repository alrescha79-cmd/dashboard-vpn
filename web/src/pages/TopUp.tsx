import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Wallet, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { QRCodeSVG as QRDisplay } from "qrcode.react";

export const TopUp: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState(25000);
  const [loading, setLoading] = useState(false);
  const [deposit, setDeposit] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchHistory = () => {
    apiFetch<{ deposits: any[] }>("/api/deposits/history")
      .then((res) => setHistory(res.deposits))
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Polling deposit status
  useEffect(() => {
    if (!deposit || deposit.status === "paid") return;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch<{ status: string; deposit: any }>(`/api/deposits/${deposit.id}/status`);
        if (res.status === "paid") {
          setDeposit((prev: any) => ({ ...prev, status: "paid" }));
          await refreshUser();
          fetchHistory();
        }
      } catch {
        // ignore polling error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [deposit]);

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 10000) return setError("Minimal deposit adalah Rp 10.000");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<any>("/api/deposits/create", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      setDeposit(res.deposit);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
          <span className="p-2 bg-kawaii-green rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Wallet className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>Top Up Saldo Akun</span>
        </h1>
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
          Isi saldo akun menggunakan metode QRIS otomatis (Gopay, OVO, DANA, ShopeePay, Bank).
        </p>
      </div>

      {error && (
        <div className="p-4 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-kawaii dark:shadow-kawaii-dark flex items-center gap-3 text-sm font-black">
          <AlertCircle className="h-5 w-5 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
          <span>{error}</span>
        </div>
      )}

      {deposit ? (
        <div className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-heading text-kawaii-ink dark:text-white">Instruksi Pembayaran QRIS</h2>
            <span
              className={`text-xs px-3.5 py-1 rounded-full font-black uppercase border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm ${
                deposit.status === "paid" ? "bg-kawaii-green text-kawaii-ink" : "bg-kawaii-yellow text-kawaii-ink"
              }`}
            >
              {deposit.status === "paid" ? "Lunas" : "Menunggu Pembayaran"}
            </span>
          </div>

          {deposit.status === "paid" ? (
            <div className="p-8 text-center bg-kawaii-subtle dark:bg-kawaii-darkSubtle rounded-3xl border-3 border-kawaii-ink dark:border-white space-y-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto stroke-[2.5]" />
              <div className="text-xl font-black font-heading text-kawaii-ink dark:text-white">Pembayaran Berhasil Diterima</div>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Saldo sebesar Rp {deposit.amount.toLocaleString("id-ID")} telah ditambahkan ke dompet Anda.
              </p>
              <button
                onClick={() => setDeposit(null)}
                className="mt-4 px-6 py-3 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl text-sm font-black text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Kembali ke Form Top Up
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
                {deposit.qr_string ? (
                  <div className="p-3 bg-white border-3 border-kawaii-ink rounded-2xl">
                    <QRDisplay value={deposit.qr_string} size={200} />
                  </div>
                ) : (
                  <div className="text-neutral-700 dark:text-neutral-300 font-black text-center text-sm">Memuat QR Code...</div>
                )}
                <div className="text-kawaii-ink dark:text-white font-black mt-3 text-xs text-center">Pindai dengan Aplikasi E-Wallet / Mobile Banking</div>
              </div>

              <div className="space-y-4">
                <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-2 text-sm font-bold">
                  <div className="flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">ID Pesanan:</span>
                    <span className="font-mono font-black text-kawaii-ink dark:text-white">{deposit.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-700 dark:text-neutral-300">Nominal Transfer:</span>
                    <span className="text-xl font-black font-heading text-kawaii-ink dark:text-white">Rp {deposit.amount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">Metode Gateway:</span>
                    <span className="uppercase text-kawaii-ink font-black px-2.5 py-0.5 bg-kawaii-yellow rounded-lg border-2 border-kawaii-ink text-xs">{deposit.method}</span>
                  </div>
                </div>

                <div className="p-4 bg-kawaii-blue/20 border-3 border-kawaii-ink dark:border-white rounded-2xl text-xs font-black text-kawaii-ink dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>Sistem memverifikasi pembayaran Anda secara otomatis dalam beberapa detik.</span>
                </div>

                <button
                  onClick={() => setDeposit(null)}
                  className="w-full py-3 bg-kawaii-card dark:bg-kawaii-darkCard hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-black rounded-2xl text-kawaii-ink dark:text-white border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  Batal / Buat Deposit Lain
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreateDeposit} className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 tracking-wider">
              1. Pilih Nominal Top Up Cepat
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[15000, 25000, 50000, 100000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3 rounded-2xl border-3 text-center font-black text-sm transition-all ${
                    amount === val
                      ? "bg-kawaii-green border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink scale-[1.03]"
                      : "bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-kawaii-ink/30 dark:border-white/30 text-neutral-800 dark:text-neutral-200 hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-card dark:hover:bg-kawaii-darkCard"
                  }`}
                >
                  Rp {val.toLocaleString("id-ID")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              2. Atau Masukkan Nominal Kustom
            </label>
            <input
              type="number"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3.5 text-base text-kawaii-ink dark:text-white font-black shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Minimal Rp 10.000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-kawaii-peach hover:bg-kawaii-peachDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {loading ? "Membuat Tagihan..." : "Lanjutkan ke Pembayaran QRIS"}
          </button>
        </form>
      )}

      {/* History Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-black font-heading text-kawaii-ink dark:text-white">Riwayat Deposit</h2>
        {history.length === 0 ? (
          <div className="p-6 text-center text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark text-xs font-bold">
            Belum ada riwayat transaksi deposit.
          </div>
        ) : (
          <div className="bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle text-kawaii-ink dark:text-white font-heading font-black border-b-3 border-kawaii-ink dark:border-white">
                <tr>
                  <th className="p-3.5">ID Transaksi</th>
                  <th className="p-3.5">Jumlah</th>
                  <th className="p-3.5">Metode</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 border-kawaii-ink/20 dark:border-white/20 font-bold text-neutral-800 dark:text-neutral-200">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-kawaii-subtle/50 dark:hover:bg-kawaii-darkSubtle/50">
                    <td className="p-3.5 font-mono font-black text-kawaii-ink dark:text-white">{h.id}</td>
                    <td className="p-3.5 font-black text-kawaii-ink dark:text-white">Rp {h.amount.toLocaleString("id-ID")}</td>
                    <td className="p-3.5 uppercase">{h.payment_method}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-3 py-0.5 rounded-full border-2 border-kawaii-ink dark:border-white font-black text-[11px] shadow-kawaii-sm ${
                          h.status === "paid" ? "bg-kawaii-green text-kawaii-ink" : "bg-kawaii-yellow text-kawaii-ink"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-600 dark:text-neutral-400 font-medium">{new Date(h.created_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};