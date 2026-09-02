import { config } from "../../config";
import { createHash } from "crypto";

export function verifyDuitkuCallbackSignature(p: { merchantCode: string; amount: string; merchantOrderId: string; signature: string; apiKey?: string }): boolean {
  const key = p.apiKey || config.DUITKU_API_KEY;
  if (!key) return false;
  const hash = createHash("md5")
    .update(`${p.merchantCode}${p.amount}${p.merchantOrderId}${key}`)
    .digest("hex");
  return hash === p.signature;
}

export async function createDuitkuDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.DUITKU_ENV === "sandbox" ? "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry" : "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
  const signature = createHash("md5")
    .update(`${config.DUITKU_MERCHANT_CODE}${orderId}${amount}${config.DUITKU_API_KEY}`)
    .digest("hex");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode: config.DUITKU_MERCHANT_CODE,
      paymentAmount: amount,
      paymentMethod: "SP",
      merchantOrderId: orderId,
      productDetails: "Deposit Saldo VPN",
      email: `user${userId}@vpnstore.local`,
      callbackUrl: `${config.PUBLIC_BASE_URL}/api/webhooks/duitku`,
      returnUrl: `${config.PUBLIC_BASE_URL}/topup`,
      signature,
      expiryPeriod: 30
    })
  });

  const json = await res.json();
  if (json.statusCode !== "00") throw new Error(json.statusMessage || "Gagal membuat transaksi Duitku");
  return {
    id: orderId,
    qr_string: json.qrString,
    checkout_url: json.paymentUrl,
    expired_at: Date.now() + 1800000
  };
}
