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
  const currentConfig = loadConfig();

  if (currentConfig.TRIPAY_ENABLED && currentConfig.TRIPAY_API_KEY && currentConfig.TRIPAY_PRIVATE_KEY && currentConfig.TRIPAY_MERCHANT_CODE) {
    try {
      return { ...(await createTripayDeposit(amount, userId, orderId)), method: "tripay" };
    } catch (e) {
      console.warn("Tripay error, falling back:", (e as Error).message);
    }
  }

  if (currentConfig.DUITKU_ENABLED && currentConfig.DUITKU_MERCHANT_CODE && currentConfig.DUITKU_API_KEY) {
    try {
      return { ...(await createDuitkuDeposit(amount, userId, orderId)), method: "duitku" };
    } catch (e) {
      console.warn("Duitku error, falling back:", (e as Error).message);
    }
  }

  if (currentConfig.PAKASIR_ENABLED && currentConfig.PAKASIR_PROJECT && currentConfig.PAKASIR_API_KEY) {
    try {
      return { ...(await createPakasirDeposit(amount, orderId)), method: "pakasir" };
    } catch (e) {
      console.warn("Pakasir error, falling back:", (e as Error).message);
    }
  }

  if (currentConfig.MIDTRANS_ENABLED && currentConfig.MIDTRANS_SERVER_KEY) {
    try {
      return { ...(await createMidtransDeposit(amount, userId, orderId)), method: "midtrans" };
    } catch (e) {
      console.warn("Midtrans error, falling back:", (e as Error).message);
    }
  }

  if (currentConfig.STATIC_QRIS_ENABLED || !currentConfig.TRIPAY_ENABLED) {
    return { ...generateStaticQRIS(amount, orderId), method: "static_qris" };
  }

  return { ...generateStaticQRIS(amount, orderId), method: "static_qris" };
}
