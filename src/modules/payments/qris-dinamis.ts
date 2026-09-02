import { config } from "../../config";

export function generateStaticQRIS(amount: number, orderId: string) {
  return {
    id: orderId,
    qr_string: config.DATA_QRIS || "00020101021126570011ID.DANA.WWW01189360091530000000005204581253033605802ID5911VPN STORE6007JAKARTA61051234062070703A016304",
    checkout_url: "",
    expired_at: Date.now() + 86400000
  };
}
