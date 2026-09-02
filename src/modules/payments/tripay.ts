import { config } from "../../config";
import { createHmac } from "crypto";

export function verifyTripaySignature(rawBody: string, signature: string, privateKey = config.TRIPAY_PRIVATE_KEY): boolean {
  if (!signature || !privateKey) return false;
  const hash = createHmac("sha256", privateKey).update(rawBody).digest("hex");
  return hash === signature;
}

export async function createTripayDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.TRIPAY_ENV === "sandbox" ? "https://tripay.co.id/api-sandbox/transaction/create" : "https://tripay.co.id/api/transaction/create";
  const signature = createHmac("sha256", config.TRIPAY_PRIVATE_KEY)
    .update(`${config.TRIPAY_MERCHANT_CODE}${orderId}${amount}`)
    .digest("hex");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.TRIPAY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      method: "QRIS2",
      merchant_ref: orderId,
      amount,
      customer_name: `User ${userId}`,
      customer_email: `user${userId}@vpnstore.local`,
      order_items: [{ name: "Deposit Saldo VPN", price: amount, quantity: 1 }],
      expired_time: Math.floor(Date.now() / 1000) + 1800,
      signature
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Gagal membuat invoice Tripay");
  return {
    id: orderId,
    qr_string: json.data.qr_string,
    checkout_url: json.data.checkout_url,
    expired_at: json.data.expired_time * 1000
  };
}
