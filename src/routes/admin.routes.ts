import { Elysia, t } from "elysia";
import { authPlugin, hashPassword } from "../lib/auth";
import { getDb } from "../db/database";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(authPlugin)
  .get("/users", ({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden: Admin only" };
    }
    const db = getDb();
    const rows = db.query("SELECT id, username, telegram_id, saldo, role, reseller_level, has_trial, display_name, created_at FROM users ORDER BY id DESC").all();
    return { users: rows };
  })
  .post(
    "/users/balance",
    ({ user, body, set }) => {
      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden: Admin only" };
      }
      const db = getDb();
      db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [body.amount, body.userId]);
      db.run("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'admin_adjust', ?, 'Penyesuaian saldo oleh Admin')", [
        body.userId,
        body.amount
      ]);
      return { success: true };
    },
    {
      body: t.Object({
        userId: t.Number(),
        amount: t.Number()
      })
    }
  )
  .get("/deposits", ({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden: Admin only" };
    }
    const db = getDb();
    const rows = db.query(`
      SELECT d.*, u.username
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 100
    `).all();
    return { deposits: rows };
  })
  .post(
    "/deposits/verify",
    ({ user, body, set }) => {
      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden: Admin only" };
      }
      const db = getDb();
      const dep = db.query("SELECT * FROM deposits WHERE id = ?").get(body.depositId) as any;
      if (!dep) {
        set.status = 404;
        return { error: "Deposit tidak ditemukan" };
      }

      if (body.action === "approve" && dep.status !== "paid") {
        db.transaction(() => {
          db.run("UPDATE deposits SET status = 'paid', admin_id = ?, decided_at = datetime('now') WHERE id = ?", [user.id, body.depositId]);
          db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [dep.amount, dep.user_id]);
          db.run("INSERT INTO topup_log (user_id, amount, reference) VALUES (?, ?, ?)", [dep.user_id, dep.amount, body.depositId]);
        })();
      } else if (body.action === "reject") {
        db.run("UPDATE deposits SET status = 'rejected', admin_id = ?, decided_at = datetime('now'), admin_note = ? WHERE id = ?", [
          user.id,
          body.note || "Ditolak oleh admin",
          body.depositId
        ]);
      }

      return { success: true };
    },
    {
      body: t.Object({
        depositId: t.String(),
        action: t.String(),
        note: t.Optional(t.String())
      })
    }
  );
