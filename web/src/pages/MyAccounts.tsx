import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Key,
  Clock,
  Server,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { AccountDetailsCard } from "../components/AccountDetailsCard";
import { ConfirmModal, AlertModal, Modal } from "../components/ui/Modal";

export const MyAccounts: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

  // Actions state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Renew state
  const [renewTarget, setRenewTarget] = useState<any | null>(null);
  const [renewDuration, setRenewDuration] = useState<number>(30);
  const [renewLoading, setRenewLoading] = useState(false);

  // Feedback modals
  const [alertMsg, setAlertMsg] = useState<{ title: string; message: string; variant: "success" | "error" } | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    apiFetch<{ accounts: any[] }>("/api/accounts/my")
      .then((res) => {
        setAccounts(res.accounts || []);
        // Auto open first account if exists and none selected
        if (res.accounts && res.accounts.length > 0 && !openAccordionId) {
          setOpenAccordionId(res.accounts[0].id);
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenAccordionId((prev) => (prev === id ? null : id));
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/accounts/${pendingDeleteId}`, { method: "DELETE" });
      setAlertMsg({ title: "Berhasil", message: "Akun VPN berhasil dihapus dari server.", variant: "success" });
      fetchAccounts();
    } catch (err: any) {
      setAlertMsg({ title: "Gagal Menghapus", message: err.message, variant: "error" });
    } finally {
      setDeleteLoading(false);
      setPendingDeleteId(null);
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget) return;
    setRenewLoading(true);
    try {
      await apiFetch("/api/accounts/renew", {
        method: "POST",
        body: JSON.stringify({
          accountId: renewTarget.id,
          durationDays: renewDuration
        })
      });
      setRenewTarget(null);
      setAlertMsg({ title: "Perpanjangan Berhasil", message: `Masa aktif akun @${renewTarget.username} berhasil diperpanjang ${renewDuration} hari.`, variant: "success" });
      fetchAccounts();
    } catch (err: any) {
      setAlertMsg({ title: "Gagal Perpanjang", message: err.message, variant: "error" });
    } finally {
      setRenewLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {/* Header Banner */}
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
            <span className="p-2 bg-kawaii-green rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
              <Shield className="h-6 w-6 text-kawaii-ink stroke-[2.5]" />
            </span>
            <span>Daftar Akun VPN Saya</span>
          </h1>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">
            Klik dropdown akun untuk melihat kredensial, UUID / Password, dan perpanjang masa aktif.
          </p>
        </div>
        <div className="text-xs font-black px-4 py-2 bg-kawaii-yellow rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm text-kawaii-ink">
          Total: {accounts.length} Akun
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center font-black text-neutral-600 dark:text-neutral-400 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark">
          Memuat daftar akun VPN...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center text-neutral-700 dark:text-neutral-300 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-3">
          <Shield className="h-12 w-12 text-kawaii-peach mx-auto stroke-[2.5]" />
          <div className="text-lg font-black font-heading text-kawaii-ink dark:text-white">Belum Ada Akun Aktif</div>
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Anda belum memiliki akun VPN tunnel yang aktif di sistem.</p>
        </div>
      ) : (
        <div className="space-y-4">
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

            const isOpen = openAccordionId === acc.id;
            const isExpired = acc.status === "expired" || (acc.expired_at && new Date(acc.expired_at) < new Date());

            return (
              <div
                key={acc.id}
                className="bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark overflow-hidden transition-all"
              >
                {/* Accordion Header / Dropdown Trigger */}
                <div
                  onClick={() => toggleAccordion(acc.id)}
                  className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-kawaii-subtle/40 dark:hover:bg-kawaii-darkSubtle/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-kawaii-peach text-kawaii-ink rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm">
                      <Key className="h-4 w-4 stroke-[2.5]" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-base text-kawaii-ink dark:text-white">
                          @{acc.username}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-black uppercase text-[11px] bg-kawaii-yellow border-2 border-kawaii-ink dark:border-white text-kawaii-ink">
                          {acc.protocol}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[11px] border-2 border-kawaii-ink dark:border-white ${
                            isExpired ? "bg-kawaii-pink text-white" : "bg-kawaii-green text-kawaii-ink"
                          }`}
                        >
                          {isExpired ? "Kedaluwarsa" : "Aktif"}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>Node: {acc.nama_server || acc.server_domain}</span>
                        <span>•</span>
                        <span>Exp: {acc.expired_at || "—"}</span>
                        {user?.role === "admin" && acc.owner_username && (
                          <>
                            <span>•</span>
                            <span className="text-kawaii-pinkDark dark:text-kawaii-yellow font-black">User: @{acc.owner_username}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t-2 md:border-0 border-kawaii-ink/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenewTarget(acc);
                      }}
                      className="px-3.5 py-2 bg-kawaii-green hover:bg-kawaii-greenDark text-xs font-black text-kawaii-ink rounded-2xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Perpanjang</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(acc.id);
                      }}
                      className="p-2 text-kawaii-ink dark:text-white hover:bg-kawaii-pink hover:text-white rounded-2xl bg-kawaii-card dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
                      title="Hapus Akun"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    <div className="p-2 rounded-2xl bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-2 border-kawaii-ink dark:border-white text-kawaii-ink dark:text-white">
                      {isOpen ? <ChevronUp className="h-4 w-4 stroke-[3]" /> : <ChevronDown className="h-4 w-4 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Dropdown Content */}
                {isOpen && (
                  <div className="p-4 md:p-6 border-t-3 border-kawaii-ink dark:border-white bg-kawaii-subtle/30 dark:bg-kawaii-darkSubtle/30 animate-in slide-in-from-top-2">
                    <AccountDetailsCard
                      title={`Detail Akun ${acc.protocol}: @${acc.username}`}
                      headerTone="emerald"
                      account={{
                        username: acc.username,
                        protocol: acc.protocol,
                        expired_at: acc.expired_at,
                        domain: acc.server_domain,
                        credentials: {
                          ...credentials,
                          password: details.password || credentials.password,
                          uuid: details.uuid || credentials.uuid
                        },
                        links,
                        raw: acc.config_json
                      }}
                      serverMeta={{
                        domain: acc.server_domain,
                        nama_server: acc.nama_server,
                        lokasi: acc.lokasi,
                        isp: acc.isp
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Renew Modal */}
      <Modal
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        title={renewTarget ? `Perpanjang Akun: @${renewTarget.username}` : "Perpanjang Akun"}
      >
        {renewTarget && (
          <form onSubmit={handleRenew} className="space-y-4 text-xs font-black">
            <div className="p-3.5 rounded-2xl bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-2 border-kawaii-ink dark:border-white space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Protokol:</span>
                <span className="text-kawaii-ink dark:text-white uppercase font-black">{renewTarget.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Server Node:</span>
                <span className="text-kawaii-ink dark:text-white font-black">{renewTarget.nama_server || renewTarget.server_domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Kedaluwarsa Saat Ini:</span>
                <span className="text-kawaii-ink dark:text-white font-mono font-black">{renewTarget.expired_at || "—"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-neutral-700 dark:text-neutral-300 font-heading uppercase">
                Pilih Durasi Perpanjangan
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 15, 30, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRenewDuration(d)}
                    className={`py-2.5 rounded-2xl border-2 text-center font-black text-xs transition-all ${
                      renewDuration === d
                        ? "bg-kawaii-yellow border-kawaii-ink dark:border-white text-kawaii-ink shadow-kawaii-sm scale-105"
                        : "bg-kawaii-card dark:bg-kawaii-darkCard border-kawaii-ink/30 dark:border-white/30 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {d} Hari
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="w-1/2 py-3 bg-kawaii-card dark:bg-kawaii-darkCard hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl font-black text-kawaii-ink dark:text-white border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={renewLoading}
                className="w-1/2 py-3 bg-kawaii-green hover:bg-kawaii-greenDark disabled:opacity-60 rounded-2xl font-black text-kawaii-ink border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm"
              >
                {renewLoading ? "Memproses..." : `Perpanjang (${renewDuration} Hari)`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Hapus Akun VPN"
        message="Apakah Anda yakin ingin menghapus akun VPN ini? Akun yang dihapus akan dicabut aksesnya dari server dan tidak dapat dipulihkan."
        confirmLabel="Hapus Sekarang"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Alert Result Modal */}
      <AlertModal
        open={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title={alertMsg?.title || "Informasi"}
        message={alertMsg?.message || ""}
        variant={alertMsg?.variant || "info"}
      />
    </div>
  );
};
