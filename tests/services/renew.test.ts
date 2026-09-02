import { describe, expect, it, beforeEach } from "bun:test";
import { getDb } from "../../src/db/database";
import { runMigrations } from "../../src/db/schema";
import { renewAccount } from "../../src/modules/services/account.service";

describe("Account Service - Renew", () => {
  beforeEach(() => {
    const db = getDb(":memory:");
    runMigrations();

    db.run("DELETE FROM accounts");
    db.run("DELETE FROM servers");
    db.run("DELETE FROM users");

    db.run("INSERT INTO users (id, username, password_hash, saldo, role, reseller_level) VALUES (1, 'user1', 'hash', 50000, 'user', 'silver')");
    db.run("INSERT INTO servers (id, domain, auth, port, harga, nama_server) VALUES (1, 'sg1.server.com', 'auth', 22, 1000, 'SG-1')");
    db.run("INSERT INTO accounts (id, username, protocol, server_id, owner_user_id, expired_at, status) VALUES ('acc-1', 'testvpn', 'SSH', 1, 1, '2026-01-01 00:00:00', 'active')");
  });

  it("successfully renews an account and deducts saldo", async () => {
    const mockProtocolRunner = async () => ({
      success: true,
      expired_at: "2026-01-31 00:00:00"
    });

    const res = await renewAccount(1, "acc-1", 30, mockProtocolRunner as any);
    expect(res.success).toBe(true);

    const db = getDb();
    const user = db.query("SELECT saldo FROM users WHERE id = 1").get() as any;
    expect(user.saldo).toBe(20000); // 50000 - (1000 * 30)

    const acc = db.query("SELECT * FROM accounts WHERE id = 'acc-1'").get() as any;
    expect(acc.status).toBe("active");
  });

  it("fails when balance is insufficient", async () => {
    const mockProtocolRunner = async () => ({ success: true });
    const res = await renewAccount(1, "acc-1", 100, mockProtocolRunner as any);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Saldo tidak mencukupi");
  });
});

