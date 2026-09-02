export interface AppConfig {
  PORT: number;
  NODE_ENV: string;
  DB_PATH: string;
  JWT_SECRET: string;
  NAMA_STORE: string;
  BOT_TOKEN: string;
  GROUP_ID: string;
  ADMIN_IDS: string[];
  PUBLIC_BASE_URL: string;
  COMMISSION_RATE: number;
  RESELLER_UPGRADE_COST: number;
  TRIAL_DURATION_MINUTES: number;
  TRIPAY_API_KEY: string;
  TRIPAY_PRIVATE_KEY: string;
  TRIPAY_MERCHANT_CODE: string;
  TRIPAY_ENV: "production" | "sandbox";
  DUITKU_MERCHANT_CODE: string;
  DUITKU_API_KEY: string;
  DUITKU_ENV: "production" | "sandbox";
  PAKASIR_PROJECT: string;
  PAKASIR_API_KEY: string;
  MIDTRANS_MERCHANT_ID: string;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_ENV: "production" | "sandbox";
  DATA_QRIS: string;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const adminIdsStr = env.ADMIN_IDS || env.USER_ID || "";
  const adminIds = adminIdsStr
    ? adminIdsStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    PORT: parseInt(env.PORT || "3000", 10),
    NODE_ENV: env.NODE_ENV || "development",
    DB_PATH: env.DB_PATH || "./data/vpn.db",
    JWT_SECRET: env.JWT_SECRET || "default-jwt-secret-change-in-production",
    NAMA_STORE: env.NAMA_STORE || "VPN Premium Store",
    BOT_TOKEN: env.BOT_TOKEN || "",
    GROUP_ID: env.GROUP_ID || "",
    ADMIN_IDS: adminIds,
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL || "http://localhost:3000",
    COMMISSION_RATE: 0.1,
    RESELLER_UPGRADE_COST: 50000,
    TRIAL_DURATION_MINUTES: 60,
    TRIPAY_API_KEY: env.TRIPAY_API_KEY || "",
    TRIPAY_PRIVATE_KEY: env.TRIPAY_PRIVATE_KEY || "",
    TRIPAY_MERCHANT_CODE: env.TRIPAY_MERCHANT_CODE || "",
    TRIPAY_ENV: (env.TRIPAY_ENV as "production" | "sandbox") || "production",
    DUITKU_MERCHANT_CODE: env.DUITKU_MERCHANT_CODE || "",
    DUITKU_API_KEY: env.DUITKU_API_KEY || "",
    DUITKU_ENV: (env.DUITKU_ENV as "production" | "sandbox") || "production",
    PAKASIR_PROJECT: env.PAKASIR_PROJECT || env.PAKASIR_SLUG || "",
    PAKASIR_API_KEY: env.PAKASIR_API_KEY || "",
    MIDTRANS_MERCHANT_ID: env.MIDTRANS_MERCHANT_ID || env.MERCHANT_ID || "",
    MIDTRANS_SERVER_KEY: env.MIDTRANS_SERVER_KEY || env.SERVER_KEY || "",
    MIDTRANS_ENV: (env.MIDTRANS_ENV as "production" | "sandbox") || "production",
    DATA_QRIS: env.DATA_QRIS || ""
  };
}

export const config = loadConfig();
