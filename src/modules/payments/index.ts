import { config } from "../../config";
import { createTripayDeposit } from "./tripay";
import { createDuitkuDeposit } from "./duitku";
import { createPakasirDeposit } from "./pakasir";
import { createMidtransDeposit } from "./midtrans";
import { generateStaticQRIS } from "./qris-dinamis";

export * from "./tripay";
export * from "./duitku";
export * from "./pakasir";
export * from "./midtrans";
export * from "./qris-dinamis";

export async function generateDepositPayment(amount: number, userId: number, orderId: string) {
  if (config.TRIPAY_API_KEY && config.TRIPAY_PRIVATE_KEY && config.TRIPAY_MERCHANT_CODE) {
    try {
      return { ...(await createTripayDeposit(amount, userId, orderId)), method: "tripay" };
    } catch (e) {
      console.warn("Tripay error, falling back:", (e as Error).message);
    }
  }

  if (config.DUITKU_MERCHANT_CODE && config.DUITKU_API_KEY) {
    try {
      return { ...(await createDuitkuDeposit(amount, userId, orderId)), method: "duitku" };
    } catch (e) {
      console.warn("Duitku error, falling back:", (e as Error).message);
    }
  }

  if (config.PAKASIR_PROJECT && config.PAKASIR_API_KEY) {
    try {
      return { ...(await createPakasirDeposit(amount, orderId)), method: "pakasir" };
    } catch (e) {
      console.warn("Pakasir error, falling back:", (e as Error).message);
    }
  }

  if (config.MIDTRANS_SERVER_KEY) {
    try {
      return { ...(await createMidtransDeposit(amount, userId, orderId)), method: "midtrans" };
    } catch (e) {
      console.warn("Midtrans error, falling back:", (e as Error).message);
    }
  }

  return { ...generateStaticQRIS(amount, orderId), method: "static_qris" };
}
