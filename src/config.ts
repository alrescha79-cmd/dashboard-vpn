import { getDb } from "./db/database";

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
  TRIPAY_ENABLED: boolean;
  TRIPAY_API_KEY: string;
  TRIPAY_PRIVATE_KEY: string;
  TRIPAY_MERCHANT_CODE: string;
  TRIPAY_ENV: "production" | "sandbox";
  DUITKU_ENABLED: boolean;
  DUITKU_MERCHANT_CODE: string;
  DUITKU_API_KEY: string;
  DUITKU_ENV: "production" | "sandbox";
  PAKASIR_ENABLED: boolean;
  PAKASIR_PROJECT: string;
  PAKASIR_API_KEY: string;
  MIDTRANS_ENABLED: boolean;
  MIDTRANS_MERCHANT_ID: string;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_ENV: "production" | "sandbox";
  STATIC_QRIS_ENABLED: boolean;
  DATA_QRIS: string;
}

export function getDbSetting(key: string, fallback: string = ""): string {
  try {
    const db = getDb();
    const row = db.query("SELECT value FROM system_settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export function setDbSetting(key: string, value: string): void {
  const db = getDb();
  db.run(
    "INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
    [key, value]
  );
}

export function getAllDbSettings(): Record<string, string> {
  try {
    const db = getDb();
    const rows = db.query("SELECT key, value FROM system_settings").all() as Array<{ key: string; value: string }>;
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  } catch {
    return {};
  }
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const adminIdsStr = getDbSetting("ADMIN_IDS", env.ADMIN_IDS || env.USER_ID || "");
  const adminIds = adminIdsStr
    ? adminIdsStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    PORT: parseInt(env.PORT || "3000", 10),
    NODE_ENV: env.NODE_ENV || "development",
    DB_PATH: env.DB_PATH || "./data/vpn.db",
    JWT_SECRET: env.JWT_SECRET || "default-jwt-secret-change-in-production",
    NAMA_STORE: getDbSetting("NAMA_STORE", env.NAMA_STORE || "VPN Premium Store"),
    BOT_TOKEN: getDbSetting("BOT_TOKEN", env.BOT_TOKEN || ""),
    GROUP_ID: getDbSetting("GROUP_ID", env.GROUP_ID || ""),
    ADMIN_IDS: adminIds,
    PUBLIC_BASE_URL: getDbSetting("PUBLIC_BASE_URL", env.PUBLIC_BASE_URL || "http://localhost:3000"),
    COMMISSION_RATE: parseFloat(getDbSetting("COMMISSION_RATE", "0.1")),
    RESELLER_UPGRADE_COST: parseInt(getDbSetting("RESELLER_UPGRADE_COST", "50000"), 10),
    TRIAL_DURATION_MINUTES: parseInt(getDbSetting("TRIAL_DURATION_MINUTES", "60"), 10),
    TRIPAY_ENABLED: getDbSetting("TRIPAY_ENABLED", "1") === "1",
    TRIPAY_API_KEY: getDbSetting("TRIPAY_API_KEY", env.TRIPAY_API_KEY || ""),
    TRIPAY_PRIVATE_KEY: getDbSetting("TRIPAY_PRIVATE_KEY", env.TRIPAY_PRIVATE_KEY || ""),
    TRIPAY_MERCHANT_CODE: getDbSetting("TRIPAY_MERCHANT_CODE", env.TRIPAY_MERCHANT_CODE || ""),
    TRIPAY_ENV: (getDbSetting("TRIPAY_ENV", env.TRIPAY_ENV || "production") as "production" | "sandbox"),
    DUITKU_ENABLED: getDbSetting("DUITKU_ENABLED", "1") === "1",
    DUITKU_MERCHANT_CODE: getDbSetting("DUITKU_MERCHANT_CODE", env.DUITKU_MERCHANT_CODE || ""),
    DUITKU_API_KEY: getDbSetting("DUITKU_API_KEY", env.DUITKU_API_KEY || ""),
    DUITKU_ENV: (getDbSetting("DUITKU_ENV", env.DUITKU_ENV || "production") as "production" | "sandbox"),
    PAKASIR_ENABLED: getDbSetting("PAKASIR_ENABLED", "1") === "1",
    PAKASIR_PROJECT: getDbSetting("PAKASIR_PROJECT", env.PAKASIR_PROJECT || env.PAKASIR_SLUG || ""),
    PAKASIR_API_KEY: getDbSetting("PAKASIR_API_KEY", env.PAKASIR_API_KEY || ""),
    MIDTRANS_ENABLED: getDbSetting("MIDTRANS_ENABLED", "1") === "1",
    MIDTRANS_MERCHANT_ID: getDbSetting("MIDTRANS_MERCHANT_ID", env.MIDTRANS_MERCHANT_ID || env.MERCHANT_ID || ""),
    MIDTRANS_SERVER_KEY: getDbSetting("MIDTRANS_SERVER_KEY", env.MIDTRANS_SERVER_KEY || env.SERVER_KEY || ""),
    MIDTRANS_ENV: (getDbSetting("MIDTRANS_ENV", env.MIDTRANS_ENV || "production") as "production" | "sandbox"),
    STATIC_QRIS_ENABLED: getDbSetting("STATIC_QRIS_ENABLED", "1") === "1",
    DATA_QRIS: getDbSetting("DATA_QRIS", env.DATA_QRIS || "")
  };
}

export const config = loadConfig();
