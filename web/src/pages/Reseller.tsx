import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Users, TrendingUp, Award, Send } from "lucide-react";
import { ConfirmModal, AlertModal } from "../components/ui/Modal";

export const Reseller: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState("");
  const [transferAmount, setTransferAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    apiFetch<any>("/api/reseller/stats")
      .then((res) => setStats(res))
      .catch(() => setStats(null));

    apiFetch<{ leaderboard: any[] }>("/api/reseller/leaderboard")
      .then((res) => setLeaderboard(res.leaderboard))
      .catch(() => setLeaderboard([]));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ msg: string; variant: "success" | "error" } | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/reseller/upgrade", { method: "POST" });
      await refreshUser();
      fetchData();
      setAlertInfo({ msg: "Selamat! Akun Anda telah berhasil di-upgrade ke Reseller.", variant: "success" });
    } catch (err: any) {
      setAlertInfo({ msg: err.message, variant: "error" });
    } finally {
      setShowUpgradeConfirm(false);
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      await apiFetch("/api/reseller/transfer", {
        method: "POST",
        body: JSON.stringify({
          targetUsername: targetUser,
          amount: transferAmount
        })
      });
      setMsg(`Berhasil mentransfer Rp ${transferAmount.toLocaleString("id-ID")} ke ${targetUser}`);
      setTargetUser("");
      await refreshUser();
      fetchData();
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
            <Users className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>Portal Kemitraan Reseller</span>
        </h1>
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
          Dapatkan diskon khusus hingga 30%, komisi penjualan otomatis, dan fitur transfer saldo.
        </p>
      </div>

      {user?.role === "user" ? (
        <div className="p-8 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark text-center space-y-4">
          <div className="p-3.5 bg-kawaii-yellow rounded-full border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm w-fit mx-auto">
            <Award className="h-12 w-12 text-kawaii-ink stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">Upgrade Akun Anda Menjadi Reseller</h2>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 max-w-lg mx-auto">
            Nikmati harga reseller otomatis (Silver 10%, Gold 20%, Platinum 30%), komisi 10% setiap transaksi, dan kemampuan mentransfer saldo antar user.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowUpgradeConfirm(true)}
              disabled={loading || user.saldo < 50000}
              className="px-8 py-3.5 bg-kawaii-yellow hover:bg-kawaii-yellowDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              {user.saldo < 50000 ? "Saldo Tidak Cukup (Biaya: Rp 50.000)" : "Upgrade Sekarang (Rp 50.000)"}
            </button>
          </div>
          <AlertModal
            open={!!alertInfo}
            onClose={() => setAlertInfo(null)}
            title={alertInfo?.variant === "success" ? "Berhasil" : "Gagal"}
            message={alertInfo?.msg || ""}
            variant={alertInfo?.variant === "success" ? "success" : "error"}
          />
          <ConfirmModal
            open={showUpgradeConfirm}
            onClose={() => setShowUpgradeConfirm(false)}
            onConfirm={handleUpgrade}
            title="Upgrade ke Reseller"
            message="Konfirmasi upgrade ke status Reseller dengan biaya Rp 50.000? Saldo akan dipotong otomatis."
            confirmLabel="Upgrade"
            loading={loading}
          />
        </div>
      ) : (
        <>
          {/* Reseller Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-1">
              <div className="text-xs font-black font-heading uppercase text-neutral-600 dark:text-neutral-400">Tier Level Anda</div>
              <div className="text-2xl font-black font-heading uppercase text-kawaii-ink dark:text-white">{stats?.level || user?.reseller_level}</div>
              <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Diskon akun aktif</div>
            </div>
            <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-1">
              <div className="text-xs font-black font-heading uppercase text-neutral-600 dark:text-neutral-400">Total Penjualan</div>
              <div className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">{stats?.totalSales || 0} Akun</div>
              <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Bulan berjalan</div>
            </div>
            <div className="p-5 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-1">
              <div className="text-xs font-black font-heading uppercase text-neutral-600 dark:text-neutral-400">Total Komisi</div>
              <div className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">Rp {(stats?.totalCommission || 0).toLocaleString("id-ID")}</div>
              <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Komisi akumulatif</div>
            </div>
          </div>

          {/* Transfer Saldo Section */}
          <div className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-5">
            <h2 className="text-lg font-black font-heading text-kawaii-ink dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-kawaii-peach rounded-xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
                <Send className="h-4 w-4 text-kawaii-ink stroke-[2.5]" />
              </span>
              <span>Transfer Saldo ke Downline / Pengguna Lain</span>
            </h2>

            {error && <div className="p-3 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white font-black text-neutral-900 dark:text-neutral-100 rounded-2xl text-xs">{error}</div>}
            {msg && <div className="p-3 bg-kawaii-green/30 border-3 border-kawaii-ink dark:border-white font-black text-neutral-900 dark:text-neutral-100 rounded-2xl text-xs">{msg}</div>}

            <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">Username Penerima</label>
                <input
                  type="text"
                  required
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-sm font-black text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
                  placeholder="Username tujuan"
                />
              </div>
              <div>
                <label className="block text-xs font-black font-heading uppercase text-neutral-700 dark:text-neutral-300 mb-1">Nominal Saldo (Rp)</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={1000}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-sm font-black text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-3.5 bg-kawaii-peach hover:bg-kawaii-peachDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {loading ? "Mengirim..." : "Kirim Saldo"}
              </button>
            </form>
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-black font-heading text-kawaii-ink dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-kawaii-yellow rounded-xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
                <TrendingUp className="h-5 w-5 text-kawaii-ink stroke-[2.5]" />
              </span>
              <span>Top 10 Reseller Leaderboard</span>
            </h2>
            <div className="bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle text-kawaii-ink dark:text-white font-heading font-black border-b-3 border-kawaii-ink dark:border-white">
                  <tr>
                    <th className="p-3.5">Peringkat</th>
                    <th className="p-3.5">Reseller</th>
                    <th className="p-3.5">Level Tier</th>
                    <th className="p-3.5">Total Akun Terjual</th>
                    <th className="p-3.5">Total Komisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 border-kawaii-ink/20 dark:border-white/20 font-bold text-neutral-800 dark:text-neutral-200">
                  {leaderboard.map((r, idx) => (
                    <tr key={idx} className="hover:bg-kawaii-subtle/50 dark:hover:bg-kawaii-darkSubtle/50">
                      <td className="p-3.5 font-black text-kawaii-ink dark:text-white">#{idx + 1}</td>
                      <td className="p-3.5 font-black text-kawaii-ink dark:text-white">{r.username}</td>
                      <td className="p-3.5 uppercase font-black">
                        <span className="px-2.5 py-0.5 rounded-full bg-kawaii-yellow text-kawaii-ink border-2 border-kawaii-ink dark:border-white text-[11px]">
                          {r.reseller_level}
                        </span>
                      </td>
                      <td className="p-3.5">{r.total_sales} Akun</td>
                      <td className="p-3.5 font-black text-kawaii-ink dark:text-white">Rp {r.total_commission.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
