import { Elysia } from "elysia";
import { getDb } from "../db/database";
import { verifyTripaySignature } from "../modules/payments/tripay";
import { verifyDuitkuCallbackSignature } from "../modules/payments/duitku";
import { verifyMidtransSignature } from "../modules/payments/midtrans";
import { config } from "../config";

function creditDeposit(orderId: string): boolean {
  const db = getDb();
  const dep = db.query("SELECT * FROM deposits WHERE id = ?").get(orderId) as any;
  if (!dep || dep.status === "paid") return false;

  db.transaction(() => {
    db.run("UPDATE deposits SET status = 'paid' WHERE id = ?", [orderId]);
    db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [dep.amount, dep.user_id]);
    db.run("INSERT INTO topup_log (user_id, amount, reference) VALUES (?, ?, ?)", [dep.user_id, dep.amount, orderId]);
    db.run("INSERT INTO notifications (user_id, title, body) VALUES (?, 'Deposit Berhasil', ?)", [
      dep.user_id,
      `Deposit Rp ${dep.amount.toLocaleString("id-ID")} telah dikreditkan ke saldo Anda.`
    ]);
  })();
  return true;
}

export const webhooksRoutes = new Elysia({ prefix: "/api/webhooks" })
  .post("/tripay", async ({ request, set }) => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-callback-signature") || "";
    if (!verifyTripaySignature(rawBody, signature, config.TRIPAY_PRIVATE_KEY || config.JWT_SECRET)) {
      set.status = 403;
      return { success: false, error: "Invalid signature" };
    }

    const payload = JSON.parse(rawBody);
    if (payload.status === "PAID") {
      creditDeposit(payload.merchant_ref);
    }
    return { success: true };
  })
  .post("/duitku", async ({ body, set }) => {
    const b = body as any;
    if (!verifyDuitkuCallbackSignature(b)) {
      set.status = 403;
      return "BAD SIGNATURE";
    }

    if (b.resultCode === "00") {
      creditDeposit(b.merchantOrderId);
    }
    return "SUCCESS";
  })
  .post("/pakasir", async ({ body, set }) => {
    const b = body as any;
    if (b.project !== config.PAKASIR_PROJECT && config.PAKASIR_PROJECT) {
      set.status = 403;
      return { error: "Invalid project" };
    }

    if (b.status === "completed") {
      creditDeposit(b.order_id);
    }
    return { success: true };
  })
  .post("/midtrans", async ({ body }) => {
    const b = body as any;
    if (
      verifyMidtransSignature({
        orderId: b.order_id,
        statusCode: b.status_code,
        grossAmount: b.gross_amount,
        signature: b.signature_key
      })
    ) {
      if (b.transaction_status === "settlement" || b.transaction_status === "capture") {
        creditDeposit(b.order_id);
      }
    }
    return { status: "ok" };
  });
