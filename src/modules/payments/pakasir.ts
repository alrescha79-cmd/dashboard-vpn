import { config } from "../../config";

export async function createPakasirDeposit(amount: number, orderId: string) {
  const endpoint = "https://app.pakasir.com/api/transactioncreate/qris";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project: config.PAKASIR_PROJECT,
      order_id: orderId,
      amount,
      api_key: config.PAKASIR_API_KEY
    })
  });

  const json = await res.json();
  if (!json.payment) throw new Error(json.message || "Gagal membuat invoice Pakasir");
  return {
    id: orderId,
    qr_string: json.payment.payment_number,
    checkout_url: `https://app.pakasir.com/pay/${config.PAKASIR_PROJECT}/${amount}?order_id=${orderId}`,
    expired_at: Date.now() + 1800000
  };
}
