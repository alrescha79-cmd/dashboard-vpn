import { Database } from "bun:sqlite";
import { getDb } from "./database";

export interface MigrationStats {
  migratedUsers: number;
  migratedServers: number;
  migratedAccounts: number;
}

export async function migrateFromLegacyDb(legacyDb: Database): Promise<MigrationStats> {
  const targetDb = getDb();
  let migratedUsers = 0;
  let migratedServers = 0;
  let migratedAccounts = 0;

  // 1. Migrate Servers
  try {
    const oldServers = legacyDb.query("SELECT * FROM Server").all() as any[];
    for (const s of oldServers) {
      targetDb.query(`
        INSERT OR IGNORE INTO servers (id, domain, auth, user_ssh, port, harga, nama_server, quota, iplimit, batas_create_akun, total_create_akun, isp, lokasi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        s.id,
        s.domain,
        s.auth,
        s.user_ssh || "root",
        s.port || 22,
        s.harga || 0,
        s.nama_server || s.domain,
        s.quota || 0,
        s.iplimit || 0,
        s.batas_create_akun || 0,
        s.total_create_akun || 0,
        s.isp || "Tidak diketahui",
        s.lokasi || "Tidak diketahui"
      );
      migratedServers++;
    }
  } catch (e) {
    console.warn("Skipping servers migration:", (e as Error).message);
  }

  // 2. Migrate Users
  try {
    const oldUsers = legacyDb.query("SELECT * FROM users").all() as any[];
    for (const u of oldUsers) {
      const username = u.username ? `tg_${u.username}` : `user_${u.user_id || u.id}`;
      const placeholderHash = await Bun.password.hash(`ResetPass_${u.user_id || u.id}!`, { algorithm: "bcrypt" });
      targetDb.query(`
        INSERT OR IGNORE INTO users (username, password_hash, telegram_id, saldo, role, reseller_level, has_trial, trial_count_today, display_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        username,
        placeholderHash,
        u.user_id || null,
        u.saldo || 0,
        u.role || "user",
        u.reseller_level || "silver",
        u.has_trial || 0,
        u.trial_count_today || 0,
        u.first_name || u.username || `User ${u.user_id || u.id}`
      );
      migratedUsers++;
    }
  } catch (e) {
    console.warn("Skipping users migration:", (e as Error).message);
  }

  return { migratedUsers, migratedServers, migratedAccounts };
}
