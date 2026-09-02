import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Shield, AlertCircle, KeyRound } from "lucide-react";

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ success: boolean; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      login(res.user);
      if (res.user.needs_setup) {
        navigate("/setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#faede2] dark:bg-[#121214] text-kawaii-ink dark:text-neutral-100 font-sans transition-colors">
      <div className="w-full max-w-md p-8 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii-pop dark:shadow-kawaii-dark-pop space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-kawaii-yellow text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">Masuk ke Akun</h1>
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Akses dashboard VPN dan kelola layanan Anda.</p>
        </div>

        <div className="flex gap-2.5 p-3.5 rounded-2xl bg-kawaii-yellow/30 dark:bg-kawaii-yellow/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 font-bold">
          <KeyRound className="h-4 w-4 shrink-0 mt-0.5 text-kawaii-ink dark:text-white stroke-[2.5]" />
          <div className="text-xs leading-relaxed">
            <span className="font-black">Kredensial Default:</span> <span className="font-mono bg-kawaii-card dark:bg-neutral-800 px-2 py-0.5 rounded-lg border-2 border-kawaii-ink dark:border-white">admin / AdminPassword123!</span>
            <br />
            Login pertama wajib mengganti username & password administrator.
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 font-black rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-sm font-black">
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Username akun Anda"
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-kawaii-peach hover:bg-kawaii-peachDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {loading ? "Memverifikasi..." : "Masuk Sekarang"}
          </button>
        </form>

        <div className="text-center text-xs font-bold text-neutral-700 dark:text-neutral-300 border-t-2 border-kawaii-ink/20 dark:border-white/20 pt-4">
          Belum punya akun?{" "}
          <Link to="/register" className="text-kawaii-ink dark:text-white hover:underline font-black">
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
};
