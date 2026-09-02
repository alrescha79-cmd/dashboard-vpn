import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";

export const SetupAdmin: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword === "AdminPassword123!" || newUsername === "admin") {
      setError("Ganti username & password dari nilai default agar lebih aman.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/setup-credentials", {
        method: "POST",
        body: JSON.stringify({
          newUsername,
          newPassword
        })
      });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#faede2] dark:bg-[#121214] flex items-center justify-center p-6 text-kawaii-ink dark:text-neutral-100 font-sans transition-colors">
        <div className="max-w-md w-full bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark p-6 space-y-3">
          <h1 className="text-xl font-black font-heading">Akses Dibatasi</h1>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Hanya admin yang perlu setup yang dapat membuka halaman ini.</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full py-3 bg-kawaii-yellow rounded-2xl text-sm font-black border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm active:translate-x-0.5 active:translate-y-0.5"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!user.needs_setup) {
    return (
      <div className="min-h-screen bg-[#faede2] dark:bg-[#121214] flex items-center justify-center p-6 text-kawaii-ink dark:text-neutral-100 font-sans transition-colors">
        <div className="max-w-md w-full bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark p-6 space-y-3">
          <div className="flex items-center gap-2 text-kawaii-ink dark:text-white font-black font-heading text-lg">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 stroke-[2.5]" />
            <span>Setup Selesai</span>
          </div>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Kredensial admin sudah diperbarui.</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full py-3 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl text-sm font-black text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            Ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#faede2] dark:bg-[#121214] text-kawaii-ink dark:text-neutral-100 font-sans transition-colors">
      <div className="w-full max-w-md p-8 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii-pop dark:shadow-kawaii-dark-pop space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-kawaii-yellow text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black font-heading">Wajib Ganti Kredensial Admin</h1>
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Akun masih menggunakan kredensial default. Ganti username & password sebelum masuk ke dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 font-black rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-black">
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Username Baru</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="admin_baru"
            />
            <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mt-1">Huruf/angka/underscore, 3-20 karakter.</p>
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Ulangi password baru"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-kawaii-green hover:bg-kawaii-greenDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {loading ? "Menyimpan..." : "Simpan & Masuk Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};
