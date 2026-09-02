import React, { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { Settings, Save, CheckCircle2, AlertCircle, ShieldCheck, Key, Globe, CreditCard } from "lucide-react";

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ settings: Record<string, any> }>("/api/admin/settings");
      setSettings(res.settings || {});
    } catch (err: any) {
      setMsg({ text: err.message || "Gagal memuat pengaturan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await apiFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ settings })
      });
      setMsg({ text: "Konfigurasi sistem & Payment Gateway berhasil disimpan!", type: "success" });
    } catch (err: any) {
      setMsg({ text: err.message || "Gagal menyimpan pengaturan", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 text-center font-black text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark">
        Memuat konfigurasi sistem...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <div>
          <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
            <span className="p-2 bg-kawaii-peach rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
              <Settings className="h-6 w-6 stroke-[2.5]" />
            </span>
            <span>Pengaturan Sistem & Gateway</span>
          </h1>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
            Konfigurasi store, environment bot, dan switch ON/OFF payment gateway.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-kawaii-green hover:bg-kawaii-greenDark disabled:opacity-60 text-kawaii-ink rounded-2xl text-sm font-black border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Save className="h-4 w-4 stroke-[3]" />
          <span>{saving ? "Menyimpan..." : "Simpan Semua"}</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-3xl border-3 shadow-kawaii-sm dark:shadow-kawaii-dark-sm flex items-center gap-3 text-sm font-black ${
            msg.type === "success"
              ? "bg-kawaii-green/30 dark:bg-kawaii-green/20 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100"
              : "bg-kawaii-pink/20 dark:bg-kawaii-pink/20 border-kawaii-ink dark:border-white text-neutral-900 dark:text-neutral-100"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 stroke-[2.5]" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-kawaii-pinkDark stroke-[2.5]" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section: General Store & Telegram */}
        <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark space-y-4">
          <div className="flex items-center gap-2 font-heading font-black text-lg text-kawaii-ink dark:text-white border-b-2 border-kawaii-ink/20 dark:border-white/20 pb-3">
            <Globe className="h-5 w-5 text-kawaii-ink dark:text-white stroke-[2.5]" />
            <span>Informasi Toko & Bot Telegram</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 uppercase font-heading">
                Nama Store
              </label>
              <input
                type="text"
                value={settings.NAMA_STORE || ""}
                onChange={(e) => handleChange("NAMA_STORE", e.target.value)}
                className="w-full bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
                placeholder="VPN Premium Store"
              />
            </div>
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 uppercase font-heading">
                Public Base URL
              </label>
              <input
                type="text"
                value={settings.PUBLIC_BASE_URL || ""}
                onChange={(e) => handleChange("PUBLIC_BASE_URL", e.target.value)}
                className="w-full bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
                placeholder="https://vpn.example.com"
              />
            </div>
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 uppercase font-heading">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={settings.BOT_TOKEN || ""}
                onChange={(e) => handleChange("BOT_TOKEN", e.target.value)}
                className="w-full bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none font-mono"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              />
            </div>
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 uppercase font-heading">
                Telegram Group ID / Admin ID
              </label>
              <input
                type="text"
                value={settings.GROUP_ID || ""}
                onChange={(e) => handleChange("GROUP_ID", e.target.value)}
                className="w-full bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none font-mono"
                placeholder="-1001234567890"
              />
            </div>
          </div>
        </div>

        {/* Section: Payment Gateway Toggles & Keys */}
        <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark space-y-6">
          <div className="flex items-center gap-2 font-heading font-black text-lg text-kawaii-ink dark:text-white border-b-2 border-kawaii-ink/20 dark:border-white/20 pb-3">
            <CreditCard className="h-5 w-5 text-kawaii-ink dark:text-white stroke-[2.5]" />
            <span>Integrasi Payment Gateway (On / Off)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tripay */}
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">Tripay</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black">{settings.TRIPAY_ENABLED ? "AKTIF" : "NONAKTIF"}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.TRIPAY_ENABLED}
                    onChange={(e) => handleChange("TRIPAY_ENABLED", e.target.checked)}
                    className="w-5 h-5 accent-kawaii-green"
                  />
                </label>
              </div>
              <div className="space-y-2 text-xs font-black">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Environment</label>
                  <select
                    value={settings.TRIPAY_ENV || "production"}
                    onChange={(e) => handleChange("TRIPAY_ENV", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 text-kawaii-ink dark:text-white"
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Merchant Code</label>
                  <input
                    type="text"
                    value={settings.TRIPAY_MERCHANT_CODE || ""}
                    onChange={(e) => handleChange("TRIPAY_MERCHANT_CODE", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={settings.TRIPAY_API_KEY || ""}
                    onChange={(e) => handleChange("TRIPAY_API_KEY", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Private Key</label>
                  <input
                    type="password"
                    value={settings.TRIPAY_PRIVATE_KEY || ""}
                    onChange={(e) => handleChange("TRIPAY_PRIVATE_KEY", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Duitku */}
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">Duitku</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black">{settings.DUITKU_ENABLED ? "AKTIF" : "NONAKTIF"}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.DUITKU_ENABLED}
                    onChange={(e) => handleChange("DUITKU_ENABLED", e.target.checked)}
                    className="w-5 h-5 accent-kawaii-green"
                  />
                </label>
              </div>
              <div className="space-y-2 text-xs font-black">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Environment</label>
                  <select
                    value={settings.DUITKU_ENV || "production"}
                    onChange={(e) => handleChange("DUITKU_ENV", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 text-kawaii-ink dark:text-white"
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Merchant Code</label>
                  <input
                    type="text"
                    value={settings.DUITKU_MERCHANT_CODE || ""}
                    onChange={(e) => handleChange("DUITKU_MERCHANT_CODE", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={settings.DUITKU_API_KEY || ""}
                    onChange={(e) => handleChange("DUITKU_API_KEY", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Pakasir */}
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">Pakasir</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black">{settings.PAKASIR_ENABLED ? "AKTIF" : "NONAKTIF"}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.PAKASIR_ENABLED}
                    onChange={(e) => handleChange("PAKASIR_ENABLED", e.target.checked)}
                    className="w-5 h-5 accent-kawaii-green"
                  />
                </label>
              </div>
              <div className="space-y-2 text-xs font-black">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Project Slug</label>
                  <input
                    type="text"
                    value={settings.PAKASIR_PROJECT || ""}
                    onChange={(e) => handleChange("PAKASIR_PROJECT", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={settings.PAKASIR_API_KEY || ""}
                    onChange={(e) => handleChange("PAKASIR_API_KEY", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Midtrans */}
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">Midtrans</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black">{settings.MIDTRANS_ENABLED ? "AKTIF" : "NONAKTIF"}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.MIDTRANS_ENABLED}
                    onChange={(e) => handleChange("MIDTRANS_ENABLED", e.target.checked)}
                    className="w-5 h-5 accent-kawaii-green"
                  />
                </label>
              </div>
              <div className="space-y-2 text-xs font-black">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Environment</label>
                  <select
                    value={settings.MIDTRANS_ENV || "production"}
                    onChange={(e) => handleChange("MIDTRANS_ENV", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 text-kawaii-ink dark:text-white"
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Merchant ID</label>
                  <input
                    type="text"
                    value={settings.MIDTRANS_MERCHANT_ID || ""}
                    onChange={(e) => handleChange("MIDTRANS_MERCHANT_ID", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1">Server Key</label>
                  <input
                    type="password"
                    value={settings.MIDTRANS_SERVER_KEY || ""}
                    onChange={(e) => handleChange("MIDTRANS_SERVER_KEY", e.target.value)}
                    className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Static QRIS */}
            <div className="md:col-span-2 bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">Static QRIS String (Fallback Manual)</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black">{settings.STATIC_QRIS_ENABLED ? "AKTIF" : "NONAKTIF"}</span>
                  <input
                    type="checkbox"
                    checked={!!settings.STATIC_QRIS_ENABLED}
                    onChange={(e) => handleChange("STATIC_QRIS_ENABLED", e.target.checked)}
                    className="w-5 h-5 accent-kawaii-green"
                  />
                </label>
              </div>
              <div className="space-y-2 text-xs font-black">
                <label className="block text-neutral-600 dark:text-neutral-400">Raw QRIS Data String (NMID / payload)</label>
                <textarea
                  rows={2}
                  value={settings.DATA_QRIS || ""}
                  onChange={(e) => handleChange("DATA_QRIS", e.target.value)}
                  className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-xl p-2 font-mono"
                  placeholder="00020101021126670016ID.CO.QRIS.WWW..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-kawaii-peach hover:bg-kawaii-peachDark disabled:opacity-60 text-kawaii-ink rounded-2xl text-sm font-black border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Save className="h-4 w-4 stroke-[3]" />
            <span>{saving ? "Menyimpan Konfigurasi..." : "Simpan Semua Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
