import { config } from "../../config";
import { createHash } from "crypto";

export function verifyMidtransSignature(p: { orderId: string; statusCode: string; grossAmount: string; signature: string; serverKey?: string }): boolean {
  const key = p.serverKey || config.MIDTRANS_SERVER_KEY;
  if (!key) return false;
  const hash = createHash("sha512")
    .update(`${p.orderId}${p.statusCode}${p.grossAmount}${key}`)
    .digest("hex");
  return hash === p.signature;
}

export async function createMidtransDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.MIDTRANS_ENV === "sandbox" ? "https://api.sandbox.midtrans.com/v2/charge" : "https://api.midtrans.com/v2/charge";
  const authHeader = `Basic ${Buffer.from(config.MIDTRANS_SERVER_KEY + ":").toString("base64")}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      payment_type: "gopay",
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { first_name: `User ${userId}`, email: `user${userId}@vpnstore.local` }
    })
  });

  const json = await res.json();
  if (json.status_code !== "201") throw new Error(json.status_message || "Gagal membuat QRIS Midtrans");
  const qrAction = json.actions?.find((a: any) => a.name === "generate-qr-code");
  return {
    id: orderId,
    qr_string: qrAction?.url || "",
    checkout_url: "",
    expired_at: Date.now() + 1800000
  };
}
