import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { buyAccount, createTrialAccount } from "../modules/services/account.service";
import { getDb } from "../db/database";
import { deleteVPNAccount } from "../modules/protocols";

export const accountsRoutes = new Elysia({ prefix: "/api/accounts" })
  .use(authPlugin)
  .post(
    "/buy",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const res = await buyAccount({ ...body, userId: user.id });
      if (!res.success) {
        set.status = 400;
        return { error: res.error };
      }
      return res;
    },
    {
      body: t.Object({
        serverId: t.Number(),
        protocol: t.String(),
        username: t.String({ minLength: 3, maxLength: 20 }),
        password: t.Optional(t.String({ minLength: 6 })),
        durationDays: t.Number({ minimum: 1, maximum: 365 })
      })
    }
  )
  .post(
    "/trial",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const res = await createTrialAccount(user.id, body.serverId, body.protocol, body.username, body.password);
      if (!res.success) {
        set.status = 400;
        return { error: res.error };
      }
      return res;
    },
    {
      body: t.Object({
        serverId: t.Number(),
        protocol: t.String(),
        username: t.String({ minLength: 3, maxLength: 20 }),
        password: t.Optional(t.String({ minLength: 6 }))
      })
    }
  )
  .get("/my", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const rows = db.query(`
      SELECT a.*, s.nama_server, s.domain as server_domain
      FROM accounts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.owner_user_id = ?
      ORDER BY a.created_at DESC
    `).all(user.id);
    return { accounts: rows };
  })
  .delete("/:id", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const acc = db.query(`
      SELECT a.*, s.domain, s.auth, s.user_ssh, s.port
      FROM accounts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.id = ?
    `).get(params.id) as any;

    if (!acc) {
      set.status = 404;
      return { error: "Akun tidak ditemukan" };
    }
    if (user.role !== "admin" && acc.owner_user_id !== user.id) {
      set.status = 403;
      return { error: "Tidak memiliki hak menghapus akun ini" };
    }

    await deleteVPNAccount(acc.protocol, acc, acc.username);

    db.transaction(() => {
      db.run("DELETE FROM accounts WHERE id = ?", [params.id]);
      db.run("DELETE FROM active_usernames WHERE username = ? AND protocol = ?", [acc.username, acc.protocol.toLowerCase()]);
      db.run("UPDATE servers SET total_create_akun = MAX(0, total_create_akun - 1) WHERE id = ?", [acc.server_id]);
    })();

    return { success: true };
  });
