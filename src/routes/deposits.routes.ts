import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { generateDepositPayment } from "../modules/payments";
import { getDb } from "../db/database";

export const depositsRoutes = new Elysia({ prefix: "/api/deposits" })
  .use(authPlugin)
  .post(
    "/create",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (body.amount < 10000) {
        set.status = 400;
        return { error: "Minimal deposit adalah Rp 10.000" };
      }

      const orderId = `ORDER-${Date.now()}-${user.id}`;
      try {
        const result = await generateDepositPayment(body.amount, user.id, orderId);
        const db = getDb();
        db.run(
          "INSERT INTO deposits (id, user_id, amount, original_amount, created_at, expired_at, status, payment_method, qr_string, checkout_url) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
          [orderId, user.id, body.amount, body.amount, Date.now(), result.expired_at, result.method, result.qr_string, result.checkout_url]
        );
        return { success: true, deposit: { ...result, amount: body.amount, id: orderId } };
      } catch (e) {
        set.status = 500;
        return { error: (e as Error).message };
      }
    },
    {
      body: t.Object({ amount: t.Number() })
    }
  )
  .get("/:id/status", ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const dep = db.query("SELECT * FROM deposits WHERE id = ?").get(params.id) as any;
    if (!dep) {
      set.status = 404;
      return { error: "Deposit tidak ditemukan" };
    }
    return { status: dep.status, deposit: dep };
  })
  .get("/history", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const list = db.query("SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(user.id);
    return { deposits: list };
  });
