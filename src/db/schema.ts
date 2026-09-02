import { getDb } from "./database";

export function runMigrations(): void {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      telegram_id INTEGER UNIQUE,
      saldo INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'admin')),
      reseller_level TEXT NOT NULL DEFAULT 'silver' CHECK (reseller_level IN ('silver', 'gold', 'platinum')),
      has_trial INTEGER NOT NULL DEFAULT 0,
      trial_count_today INTEGER NOT NULL DEFAULT 0,
      last_trial_date TEXT,
      display_name TEXT,
      needs_setup INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      auth TEXT NOT NULL,
      user_ssh TEXT NOT NULL DEFAULT 'root',
      port INTEGER NOT NULL DEFAULT 22,
      harga INTEGER NOT NULL DEFAULT 0,
      nama_server TEXT NOT NULL DEFAULT '',
      quota INTEGER NOT NULL DEFAULT 0,
      iplimit INTEGER NOT NULL DEFAULT 0,
      batas_create_akun INTEGER NOT NULL DEFAULT 0,
      total_create_akun INTEGER NOT NULL DEFAULT 0,
      isp TEXT DEFAULT 'Tidak diketahui',
      lokasi TEXT DEFAULT 'Tidak diketahui',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      protocol TEXT NOT NULL CHECK (protocol IN ('SSH', 'VMESS', 'VLESS', 'TROJAN', 'SHADOWSOCKS', '3IN1')),
      server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expired_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
      config_json TEXT,
      raw_response TEXT,
      expiry_warning_3d_sent INTEGER NOT NULL DEFAULT 0,
      expiry_warning_1d_sent INTEGER NOT NULL DEFAULT 0,
      expired_notified INTEGER NOT NULL DEFAULT 0,
      UNIQUE (username, server_id, protocol)
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
    CREATE INDEX IF NOT EXISTS idx_accounts_expired_at ON accounts(expired_at);

    CREATE TABLE IF NOT EXISTS active_usernames (
      username TEXT NOT NULL,
      protocol TEXT NOT NULL,
      PRIMARY KEY (username, protocol)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      layanan TEXT NOT NULL,
      akun TEXT NOT NULL,
      hari INTEGER NOT NULL,
      harga INTEGER NOT NULL,
      komisi INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      original_amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expired_at INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_verification', 'paid', 'rejected', 'cancelled', 'expired', 'failed')),
      payment_method TEXT NOT NULL DEFAULT 'static_qris',
      qr_string TEXT,
      checkout_url TEXT,
      proof_path TEXT,
      admin_id INTEGER REFERENCES users(id),
      admin_note TEXT,
      decided_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trial_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      jenis TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reseller_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reseller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      buyer_id INTEGER REFERENCES users(id),
      akun_type TEXT NOT NULL,
      username TEXT NOT NULL,
      komisi INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reseller_upgrade_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      level TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saldo_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Patch for existing installs: add missing column safely
  try {
    db.run("ALTER TABLE users ADD COLUMN needs_setup INTEGER NOT NULL DEFAULT 0");
  } catch {}
}
