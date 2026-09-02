import { Elysia, t } from "elysia";
import { authPlugin, hashPassword } from "../lib/auth";
import { getDb } from "../db/database";
import { getAllDbSettings, setDbSetting, loadConfig } from "../config";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(authPlugin)
  .get("/settings", ({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden: Admin only" };
    }
    const current = loadConfig();
    const rawSettings = getAllDbSettings();
    return {
      settings: {
        NAMA_STORE: current.NAMA_STORE,
        PUBLIC_BASE_URL: current.PUBLIC_BASE_URL,
        BOT_TOKEN: current.BOT_TOKEN,
        GROUP_ID: current.GROUP_ID,
        ADMIN_IDS: current.ADMIN_IDS.join(", "),
        COMMISSION_RATE: current.COMMISSION_RATE,
        RESELLER_UPGRADE_COST: current.RESELLER_UPGRADE_COST,
        TRIAL_DURATION_MINUTES: current.TRIAL_DURATION_MINUTES,

        // Payment Gateways Switch & Keys
        TRIPAY_ENABLED: current.TRIPAY_ENABLED,
        TRIPAY_API_KEY: current.TRIPAY_API_KEY,
        TRIPAY_PRIVATE_KEY: current.TRIPAY_PRIVATE_KEY,
        TRIPAY_MERCHANT_CODE: current.TRIPAY_MERCHANT_CODE,
        TRIPAY_ENV: current.TRIPAY_ENV,

        DUITKU_ENABLED: current.DUITKU_ENABLED,
        DUITKU_MERCHANT_CODE: current.DUITKU_MERCHANT_CODE,
        DUITKU_API_KEY: current.DUITKU_API_KEY,
        DUITKU_ENV: current.DUITKU_ENV,

        PAKASIR_ENABLED: current.PAKASIR_ENABLED,
        PAKASIR_PROJECT: current.PAKASIR_PROJECT,
        PAKASIR_API_KEY: current.PAKASIR_API_KEY,

        MIDTRANS_ENABLED: current.MIDTRANS_ENABLED,
        MIDTRANS_MERCHANT_ID: current.MIDTRANS_MERCHANT_ID,
        MIDTRANS_SERVER_KEY: current.MIDTRANS_SERVER_KEY,
        MIDTRANS_ENV: current.MIDTRANS_ENV,

        STATIC_QRIS_ENABLED: current.STATIC_QRIS_ENABLED,
        DATA_QRIS: current.DATA_QRIS
      }
    };
  })
  .post(
    "/settings",
    ({ user, body, set }) => {
      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden: Admin only" };
      }

      for (const [k, v] of Object.entries(body.settings)) {
        if (typeof v === "boolean") {
          setDbSetting(k, v ? "1" : "0");
        } else if (v !== undefined && v !== null) {
          setDbSetting(k, String(v).trim());
        }
      }

      return { success: true, message: "Pengaturan berhasil disimpan" };
    },
    {
      body: t.Object({
        settings: t.Record(t.String(), t.Any())
      })
    }
  )
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
  )
  .get("/stats/overview", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const isAdmin = user.role === "admin";

    // Global / User Active Accounts
    const accountsCount = isAdmin
      ? (db.query("SELECT COUNT(*) as count FROM accounts WHERE status = 'active'").get() as any)?.count || 0
      : (db.query("SELECT COUNT(*) as count FROM accounts WHERE owner_user_id = ? AND status = 'active'").get(user.id) as any)?.count || 0;

    const serversCount = (db.query("SELECT COUNT(*) as count FROM servers").get() as any)?.count || 0;
    const usersCount = (db.query("SELECT COUNT(*) as count FROM users").get() as any)?.count || 0;

    // Total successful deposit volume (Admin = all, User = own)
    const depositVolume = isAdmin
      ? (db.query("SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = 'paid'").get() as any)?.total || 0
      : (db.query("SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = ? AND status = 'paid'").get(user.id) as any)?.total || 0;

    // Protocol distribution
    const protoQuery = isAdmin
      ? "SELECT protocol, COUNT(*) as count FROM accounts GROUP BY protocol"
      : "SELECT protocol, COUNT(*) as count FROM accounts WHERE owner_user_id = ? GROUP BY protocol";
    const protocols = (isAdmin ? db.query(protoQuery).all() : db.query(protoQuery).all(user.id)) as Array<{ protocol: string; count: number }>;

    // 7 Days Trend (Created Accounts & Transactions)
    const sevenDaysTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });

      const acctQuery = isAdmin
        ? "SELECT COUNT(*) as count FROM accounts WHERE date(created_at) = date(?)"
        : "SELECT COUNT(*) as count FROM accounts WHERE owner_user_id = ? AND date(created_at) = date(?)";
      const acctCount = (isAdmin ? db.query(acctQuery).get(dateStr) : db.query(acctQuery).get(user.id, dateStr) as any)?.count || 0;

      const salesQuery = isAdmin
        ? "SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = 'paid' AND date(created_at / 1000, 'unixepoch') = date(?)"
        : "SELECT COALESCE(SUM(harga), 0) as total FROM invoices WHERE user_id = ? AND date(created_at) = date(?)";
      const salesVolume = (isAdmin ? db.query(salesQuery).get(dateStr) : db.query(salesQuery).get(user.id, dateStr) as any)?.total || 0;

      sevenDaysTrend.push({
        date: dateStr,
        label: displayDate,
        accounts: acctCount,
        volume: salesVolume
      });
    }

    return {
      stats: {
        accountsCount,
        serversCount,
        usersCount,
        depositVolume,
        protocols,
        trend: sevenDaysTrend
      }
    };
  });
