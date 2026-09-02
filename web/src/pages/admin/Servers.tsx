import React, { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { Server, Plus, Trash2, Activity, Pencil, X } from "lucide-react";
import { Modal, ConfirmModal, AlertModal } from "../../components/ui/Modal";

type ServerRow = {
  id: number;
  domain: string;
  user_ssh: string;
  port: number;
  harga: number;
  nama_server: string;
  quota: number;
  iplimit: number;
  batas_create_akun: number;
  total_create_akun: number;
  isp: string;
  lokasi: string;
};

const emptyForm = {
  domain: "",
  auth: "",
  user_ssh: "root",
  port: 22,
  harga: 1000,
  nama_server: "",
  quota: 0,
  iplimit: 2,
  batas_create_akun: 100,
  isp: "DigitalOcean",
  lokasi: "Singapore"
};

function ServerFormModal({
  open,
  onClose,
  title,
  submitLabel,
  form,
  setForm,
  onSubmit,
  authOptional
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSubmit: (e: React.FormEvent) => void;
  authOptional?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs font-bold">
        <div>
          <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Nama Server</label>
          <input
            type="text"
            required
            value={form.nama_server}
            onChange={(e) => setForm({ ...form, nama_server: e.target.value })}
            className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
            placeholder="Misal: SG High Speed 1"
          />
        </div>
        <div>
          <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Domain / IP Host</label>
          <input
            type="text"
            required
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white font-mono shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
            placeholder="sg1.yourdomain.com"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">User SSH</label>
            <input
              type="text"
              required
              value={form.user_ssh}
              onChange={(e) => setForm({ ...form, user_ssh: e.target.value })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Port SSH</label>
            <input
              type="number"
              required
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-neutral-600 dark:text-neutral-300 mb-1">
            Password Root SSH {authOptional && <span className="text-neutral-400 font-normal">(kosongkan jika tidak diganti)</span>}
          </label>
          <input
            type="password"
            required={!authOptional}
            value={form.auth}
            onChange={(e) => setForm({ ...form, auth: e.target.value })}
            className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            placeholder={authOptional ? "••••••••" : "Password VPS"}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Harga / Hari (Rp)</label>
            <input
              type="number"
              required
              value={form.harga}
              onChange={(e) => setForm({ ...form, harga: Number(e.target.value) })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Batas Kuota Akun</label>
            <input
              type="number"
              required
              value={form.batas_create_akun}
              onChange={(e) => setForm({ ...form, batas_create_akun: Number(e.target.value) })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Quota (GB)</label>
            <input
              type="number"
              value={form.quota}
              onChange={(e) => setForm({ ...form, quota: Number(e.target.value) })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">IP Limit</label>
            <input
              type="number"
              value={form.iplimit}
              onChange={(e) => setForm({ ...form, iplimit: Number(e.target.value) })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-neutral-600 dark:text-neutral-300 mb-1">Lokasi</label>
            <input
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-neutral-600 dark:text-neutral-300 mb-1">ISP / Provider</label>
          <input
            type="text"
            value={form.isp}
            onChange={(e) => setForm({ ...form, isp: e.target.value })}
            className="w-full bg-white dark:bg-kawaii-darkCard border-2 border-kawaii-ink dark:border-white rounded-2xl p-2.5 text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white dark:bg-kawaii-darkCard hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl font-black text-kawaii-ink dark:text-white border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            Batal
          </button>
          <button type="submit" className="flex-1 py-3 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl font-black text-kawaii-ink border-2 border-kawaii-ink shadow-kawaii active:translate-x-0.5 active:translate-y-0.5 transition-all">
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export const AdminServers: React.FC = () => {
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ServerRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [testResult, setTestResult] = useState<{ id: number; msg: string; success: boolean } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ msg: string; success: boolean } | null>(null);

  const fetchServers = () => {
    setLoading(true);
    apiFetch<{ servers: ServerRow[] }>("/api/servers")
      .then((res) => setServers(res.servers))
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleTestSSH = async (id: number) => {
    setTestResult({ id, msg: "Menguji koneksi SSH... ⏳", success: true });
    try {
      const res = await apiFetch<any>(`/api/servers/admin/${id}/test`, { method: "POST" });
      setTestResult({ id, msg: res.success ? "Online: " + String(res.output).slice(0, 160) : "Offline: " + res.error, success: res.success });
    } catch (err: any) {
      setTestResult({ id, msg: "Gagal: " + err.message, success: false });
    }
  };

  const handleDelete = async () => {
    if (pendingDeleteId == null) return;
    try {
      await apiFetch(`/api/servers/admin/${pendingDeleteId}`, { method: "DELETE" });
      fetchServers();
    } catch (err: any) {
      setAlertInfo({ msg: err.message, success: false });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/servers/admin", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setShowAddModal(false);
      setForm({ ...emptyForm });
      fetchServers();
    } catch (err: any) {
      setAlertInfo({ msg: err.message, success: false });
    }
  };

  const openEdit = (s: ServerRow) => {
    setForm({
      domain: s.domain,
      auth: "",
      user_ssh: s.user_ssh || "root",
      port: s.port,
      harga: s.harga,
      nama_server: s.nama_server,
      quota: s.quota ?? 0,
      iplimit: s.iplimit ?? 0,
      batas_create_akun: s.batas_create_akun ?? 100,
      isp: s.isp || "",
      lokasi: s.lokasi || ""
    });
    setEditTarget(s);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const payload: any = { ...form };
    if (!payload.auth) delete payload.auth;
    try {
      await apiFetch(`/api/servers/admin/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setEditTarget(null);
      fetchServers();
    } catch (err: any) {
      setAlertInfo({ msg: err.message, success: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <div>
          <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
            <span className="p-2 bg-kawaii-pink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm text-white">
              <Server className="h-6 w-6 stroke-[2.5]" />
            </span>
            <span>Kelola Node Server VPN</span>
          </h1>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">Tambah, ubah, monitor status, dan konfigurasi harga server.</p>
        </div>
        <button
          onClick={() => {
            setForm({ ...emptyForm });
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl text-sm font-black flex items-center gap-2 text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Tambah Server</span>
        </button>
      </div>

      <ServerFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Server Baru"
        submitLabel="Simpan Server"
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
      />

      <ServerFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Server: ${editTarget?.nama_server || ""}`}
        submitLabel="Simpan Perubahan"
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        authOptional
      />

      <div className="bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle text-kawaii-ink dark:text-white font-heading font-black border-b-3 border-kawaii-ink dark:border-white">
            <tr>
              <th className="p-3.5">Nama Server</th>
              <th className="p-3.5">Domain</th>
              <th className="p-3.5">Lokasi / ISP</th>
              <th className="p-3.5">Harga</th>
              <th className="p-3.5">Kapasitas</th>
              <th className="p-3.5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 border-kawaii-ink/20 dark:border-white/20 font-bold text-neutral-800 dark:text-neutral-200">
            {servers.map((s) => (
              <tr key={s.id} className="hover:bg-kawaii-subtle/50 dark:hover:bg-kawaii-darkSubtle/50">
                <td className="p-3.5 font-heading font-black text-kawaii-ink dark:text-white text-sm">{s.nama_server}</td>
                <td className="p-3.5 font-mono text-neutral-700 font-bold">
                  {s.domain}:{s.port}
                </td>
                <td className="p-3.5 font-medium">
                  {s.lokasi} ({s.isp})
                </td>
                <td className="p-3.5 font-black text-kawaii-ink">Rp {s.harga.toLocaleString("id-ID")}/hr</td>
                <td className="p-3.5">
                  {s.total_create_akun} / {s.batas_create_akun || "∞"}
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleTestSSH(s.id)}
                    className="px-3 py-1.5 bg-kawaii-blue hover:bg-kawaii-blueDark rounded-xl text-kawaii-ink border-2 border-kawaii-ink shadow-kawaii-sm font-black flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Test Koneksi SSH"
                  >
                    <Activity className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Test</span>
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-xl bg-kawaii-yellow border-2 border-kawaii-ink shadow-kawaii-sm text-kawaii-ink hover:bg-kawaii-yellowDark transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Edit Server"
                    aria-label="Edit Server"
                  >
                    <Pencil className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(s.id)}
                    className="p-1.5 rounded-xl bg-kawaii-pink border-2 border-kawaii-ink shadow-kawaii-sm text-white hover:bg-kawaii-pinkDark transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Hapus Server"
                    aria-label="Hapus Server"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {servers.length === 0 && !loading && (
          <div className="p-8 text-center text-xs font-bold text-neutral-600">Belum ada server terdaftar.</div>
        )}
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-3xl border-3 border-kawaii-ink shadow-kawaii text-xs font-mono font-bold break-all ${
            testResult.success
              ? "bg-kawaii-green text-kawaii-ink"
              : "bg-kawaii-pink text-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{testResult.msg}</span>
            <button onClick={() => setTestResult(null)} className="p-1 rounded-full bg-white/20 hover:bg-white/40">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingDeleteId != null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Server"
        message="Server akan dihapus permanen. Akun terkait di server tersebut akan tetap ada di VPS. Lanjutkan?"
        confirmLabel="Hapus"
        variant="danger"
      />

      <AlertModal
        open={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.success ? "Berhasil" : "Gagal"}
        message={alertInfo?.msg || ""}
        variant={alertInfo?.success ? "success" : "error"}
      />
    </div>
  );
};
