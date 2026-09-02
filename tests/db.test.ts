import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { seedInitialAdmin } from "../src/db/seed";

describe("Database & Seed Layer", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("enforces foreign key constraints", () => {
    const db = getDb();
    expect(() => {
      db.run("INSERT INTO accounts (id, username, protocol, server_id, owner_user_id) VALUES ('1', 'user1', 'SSH', 999, 999)");
    }).toThrow();
  });

  it("creates initial admin user safely and idempotently", async () => {
    const created = await seedInitialAdmin("admin", "AdminPassword123!");
    expect(created).toBe(true);

    const db = getDb();
    const admin = db.query("SELECT * FROM users WHERE username = 'admin'").get() as any;
    expect(admin).toBeDefined();
    expect(admin.role).toBe("admin");

    const second = await seedInitialAdmin("admin", "AnotherPass");
    expect(second).toBe(false);
  });
});
