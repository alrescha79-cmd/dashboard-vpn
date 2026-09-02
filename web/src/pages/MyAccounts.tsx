import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { Shield, Trash2 } from "lucide-react";
import { AccountDetailsCard } from "../components/AccountDetailsCard";
import { ConfirmModal, AlertModal } from "../components/ui/Modal";

export const MyAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    apiFetch<{ accounts: any[] }>("/api/accounts/my")
      .then((res) => setAccounts(res.accounts))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/accounts/${pendingDeleteId}`, { method: "DELETE" });
      fetchAccounts();
    } catch (err: any) {
      setAlertMsg(err.message);
    } finally {
      setDeleteLoading(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
          <span className="p-2 bg-kawaii-green rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>Daftar Akun VPN Saya</span>
        </h1>
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
          Kelola konfigurasi dan informasi akun tunnel yang telah Anda buat.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center font-black text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark">
          Memuat daftar akun...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center text-neutral-700 dark:text-neutral-300 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-3">
          <Shield className="h-12 w-12 text-kawaii-peach mx-auto stroke-[2.5]" />
          <div className="text-lg font-black font-heading text-kawaii-ink dark:text-white">Belum Ada Akun Aktif</div>
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Anda belum memiliki akun VPN tunnel yang aktif.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {accounts.map((acc) => {
            let details: Record<string, any> = {};
            let credentials: Record<string, any> = {};
            let links: Record<string, string> = {};
            try {
              details = JSON.parse(acc.config_json || "{}");
              for (const [k, v] of Object.entries(details)) {
                const s = String(v);
                if (s.includes("://")) links[k] = s;
                else credentials[k] = v;
              }
            } catch {
              details = {};
            }

            return (
              <div key={acc.id} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <span className="font-black text-kawaii-ink dark:text-white text-sm">@{acc.username}</span>
                    <span className="px-3 py-0.5 rounded-full font-black uppercase bg-kawaii-peach border-2 border-kawaii-ink dark:border-white text-kawaii-ink">
                      {acc.protocol}
                    </span>
                    <span>• {acc.nama_server} ({acc.server_domain})</span>
                  </div>
                  <button
                    onClick={() => setPendingDeleteId(acc.id)}
                    className="p-2 text-kawaii-ink dark:text-white hover:text-white rounded-2xl bg-kawaii-card dark:bg-kawaii-darkCard hover:bg-kawaii-pink border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Hapus Akun"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <AccountDetailsCard
                  title={`${acc.protocol}: ${acc.username}`}
                  headerTone="emerald"
                  account={{
                    username: acc.username,
                    protocol: acc.protocol,
                    expired_at: acc.expired_at,
                    domain: acc.server_domain,
                    credentials,
                    links,
                    raw: acc.config_json
                  }}
                  serverMeta={{
                    domain: acc.server_domain,
                    nama_server: acc.nama_server
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Hapus Akun"
        message="Akun VPN akan dihapus dari server VPS. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Akun"
        variant="danger"
        loading={deleteLoading}
      />

      <AlertModal
        open={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title="Terjadi Kesalahan"
        message={alertMsg || ""}
        variant="error"
      />
    </div>
  );
};
