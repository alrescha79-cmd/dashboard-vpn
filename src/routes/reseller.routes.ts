import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { getDb } from "../db/database";
import { config } from "../config";

export const resellerRoutes = new Elysia({ prefix: "/api/reseller" })
  .use(authPlugin)
  .get("/stats", ({ user, set }) => {
    if (!user || (user.role !== "reseller" && user.role !== "admin")) {
      set.status = 403;
      return { error: "Akses Reseller diperlukan" };
    }
    const db = getDb();
    const sales = db.query(`
      SELECT COUNT(id) as total_sales, COALESCE(SUM(komisi), 0) as total_commission
      FROM reseller_sales
      WHERE reseller_id = ?
    `).get(user.id) as any;

    const recent = db.query(`
      SELECT * FROM reseller_sales WHERE reseller_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(user.id);

    return {
      level: user.reseller_level,
      totalSales: sales?.total_sales || 0,
      totalCommission: sales?.total_commission || 0,
      recentSales: recent
    };
  })
  .post("/upgrade", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    if (user.role === "reseller" || user.role === "admin") {
      set.status = 400;
      return { error: "Akun Anda sudah berstatus reseller" };
    }
    if (user.saldo < config.RESELLER_UPGRADE_COST) {
      set.status = 400;
      return { error: `Saldo tidak mencukupi untuk upgrade (Butuh Rp ${config.RESELLER_UPGRADE_COST.toLocaleString("id-ID")})` };
    }

    const db = getDb();
    db.transaction(() => {
      db.run("UPDATE users SET saldo = saldo - ?, role = 'reseller', reseller_level = 'silver' WHERE id = ?", [
        config.RESELLER_UPGRADE_COST,
        user.id
      ]);
      db.run("INSERT INTO reseller_upgrade_log (user_id, amount, level) VALUES (?, ?, 'silver')", [
        user.id,
        config.RESELLER_UPGRADE_COST
      ]);
      db.run("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'upgrade', ?, 'Upgrade Akun Reseller')", [
        user.id,
        -config.RESELLER_UPGRADE_COST
      ]);
    })();

    return { success: true };
  })
  .post(
    "/transfer",
    async ({ user, body, set }) => {
      if (!user || (user.role !== "reseller" && user.role !== "admin")) {
        set.status = 403;
        return { error: "Akses Reseller diperlukan" };
      }
      if (body.amount < 10000) {
        set.status = 400;
        return { error: "Minimal transfer saldo adalah Rp 10.000" };
      }
      if (user.saldo < body.amount) {
        set.status = 400;
        return { error: "Saldo Anda tidak mencukupi" };
      }

      const db = getDb();
      const target = db.query("SELECT id, username FROM users WHERE username = ?").get(body.targetUsername) as any;
      if (!target) {
        set.status = 404;
        return { error: "User penerima tidak ditemukan" };
      }
      if (target.id === user.id) {
        set.status = 400;
        return { error: "Tidak dapat mentransfer saldo ke diri sendiri" };
      }

      db.transaction(() => {
        db.run("UPDATE users SET saldo = saldo - ? WHERE id = ?", [body.amount, user.id]);
        db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [body.amount, target.id]);
        db.run("INSERT INTO saldo_transfers (from_id, to_id, amount) VALUES (?, ?, ?)", [user.id, target.id, body.amount]);
        db.run("INSERT INTO notifications (user_id, title, body) VALUES (?, 'Transfer Saldo Diterima', ?)", [
          target.id,
          `Anda menerima transfer saldo Rp ${body.amount.toLocaleString("id-ID")} dari ${user.username}.`
        ]);
      })();

      return { success: true };
    },
    {
      body: t.Object({
        targetUsername: t.String(),
        amount: t.Number()
      })
    }
  )
  .get("/leaderboard", () => {
    const db = getDb();
    const rows = db.query(`
      SELECT u.username, u.reseller_level, COUNT(r.id) as total_sales, COALESCE(SUM(r.komisi), 0) as total_commission
      FROM reseller_sales r
      JOIN users u ON r.reseller_id = u.id
      GROUP BY r.reseller_id
      ORDER BY total_commission DESC
      LIMIT 10
    `).all();
    return { leaderboard: rows };
  });
