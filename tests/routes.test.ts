import { describe, expect, it, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { authRoutes } from "../src/routes/auth.routes";
import { serversRoutes } from "../src/routes/servers.routes";

describe("API Route Tests", () => {
  let app: Elysia;

  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    app = new Elysia().use(authRoutes).use(serversRoutes);
  });

  it("registers a user and prevents duplicates", async () => {
    const res1 = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "john", password: "Password123" })
      })
    );
    expect(res1.status).toBe(201);

    const res2 = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "john", password: "Password123" })
      })
    );
    expect(res2.status).toBe(400);
  });

  it("lists servers publicly without leaking passwords", async () => {
    const db = getDb();
    db.run("INSERT INTO servers (domain, auth, harga, nama_server) VALUES ('sg.node.com', 'secretpass', 1000, 'Singapore 1')");
    const res = await app.handle(new Request("http://localhost/api/servers"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.servers.length).toBe(1);
    expect(body.servers[0].auth).toBeUndefined();
    expect(body.servers[0].nama_server).toBe("Singapore 1");
  });
});
