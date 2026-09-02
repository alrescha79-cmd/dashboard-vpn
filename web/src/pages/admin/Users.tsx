import React, { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { UserCheck, DollarSign, Search } from "lucide-react";
import { Modal, AlertModal } from "../../components/ui/Modal";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [amount, setAmount] = useState(50000);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    apiFetch<{ users: any[] }>("/api/admin/users")
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    try {
      await apiFetch("/api/admin/users/balance", {
        method: "POST",
        body: JSON.stringify({ userId: adjustingUser.id, amount })
      });
      setAdjustingUser(null);
      fetchUsers();
    } catch (err: any) {
      setAlertMsg(err.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-kawaii-card dark:bg-kawaii-darkCard p-6 rounded-3xl border-4 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark">
        <div>
          <h1 className="text-2xl font-black font-heading flex items-center gap-2 text-kawaii-ink dark:text-white">
            <span className="p-2 bg-kawaii-pink rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm text-white">
              <UserCheck className="h-6 w-6 stroke-[2.5]" />
            </span>
            <span>Manajemen Pengguna</span>
          </h1>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-1">Kelola data pengguna, peranan, dan saldo dompet.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-black text-kawaii-ink dark:text-white shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
            placeholder="Cari username..."
          />
        </div>
      </div>

      <Modal
        open={!!adjustingUser}
        onClose={() => setAdjustingUser(null)}
        title={adjustingUser ? `Ubah Saldo: @${adjustingUser.username}` : "Ubah Saldo"}
      >
        {adjustingUser && (
          <form onSubmit={handleAdjustBalance} className="space-y-4 text-xs font-black">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1">
                Nominal Penambahan / Pengurangan (Bisa Negatif)
              </label>
              <input
                type="number"
                required
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white rounded-2xl p-3 text-kawaii-ink dark:text-white text-sm font-black shadow-kawaii-sm focus:outline-none focus:bg-kawaii-yellow/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="w-1/2 py-3 bg-kawaii-card dark:bg-kawaii-darkCard hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl font-black text-kawaii-ink dark:text-white border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 py-3 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl font-black text-kawaii-ink border-3 border-kawaii-ink shadow-kawaii active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Eksekusi
              </button>
            </div>
          </form>
        )}
      </Modal>

      <AlertModal
        open={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title="Gagal"
        message={alertMsg || ""}
        variant="error"
      />

      {/* Users Table */}
      <div className="bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle text-kawaii-ink dark:text-white font-heading font-black border-b-3 border-kawaii-ink dark:border-white">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Username</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Tier</th>
              <th className="p-3.5">Saldo</th>
              <th className="p-3.5">Terdaftar</th>
              <th className="p-3.5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 border-kawaii-ink/20 dark:border-white/20 font-bold text-neutral-800 dark:text-neutral-200">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-kawaii-subtle/50 dark:hover:bg-kawaii-darkSubtle/50">
                <td className="p-3.5 text-neutral-500 dark:text-neutral-400 font-bold">#{u.id}</td>
                <td className="p-3.5 font-black text-kawaii-ink dark:text-white">@{u.username}</td>
                <td className="p-3.5 uppercase font-black">
                  <span className="px-2.5 py-0.5 rounded-full bg-kawaii-blue border-2 border-kawaii-ink text-kawaii-ink text-[11px]">
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 uppercase font-black">
                  <span className="px-2.5 py-0.5 rounded-full bg-kawaii-yellow border-2 border-kawaii-ink text-kawaii-ink text-[11px]">
                    {u.reseller_level}
                  </span>
                </td>
                <td className="p-3.5 font-black text-kawaii-ink dark:text-white">Rp {u.saldo.toLocaleString("id-ID")}</td>
                <td className="p-3.5 text-neutral-600 dark:text-neutral-400 font-medium">{u.created_at}</td>
                <td className="p-3.5">
                  <button
                    onClick={() => setAdjustingUser(u)}
                    className="px-3 py-1.5 bg-kawaii-green hover:bg-kawaii-greenDark rounded-xl text-kawaii-ink border-2 border-kawaii-ink shadow-kawaii-sm font-black flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Ubah Saldo"
                  >
                    <DollarSign className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Saldo</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
