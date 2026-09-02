import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Shield, AlertCircle } from "lucide-react";

export const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch<{ success: boolean; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          display_name: displayName || undefined
        })
      });
      // Auto login
      const loginRes = await apiFetch<{ success: boolean; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      login(loginRes.user);
      navigate("/");
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
          <div className="inline-flex p-3.5 bg-kawaii-peach text-kawaii-ink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">Daftar Akun Baru</h1>
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Buat akun untuk memesan tunnel VPN dan kelola saldo.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-kawaii-pink/20 border-3 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100 font-black rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-sm font-black">
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Nama Tampilan</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Nama lengkap atau alias"
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Username</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Hanya huruf & angka"
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-heading text-xs uppercase">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-kawaii-green hover:bg-kawaii-greenDark disabled:bg-neutral-200 dark:disabled:bg-neutral-800 font-black rounded-2xl text-sm text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {loading ? "Mendaftarkan..." : "Daftar Akun Sekarang"}
          </button>
        </form>

        <div className="text-center text-xs font-bold text-neutral-700 dark:text-neutral-300 border-t-2 border-kawaii-ink/20 dark:border-white/20 pt-4">
          Sudah memiliki akun?{" "}
          <Link to="/login" className="text-kawaii-ink dark:text-white hover:underline font-black">
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
};
