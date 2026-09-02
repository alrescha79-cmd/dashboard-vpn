import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { initDatabase } from "../src/db/database";
import { runMigrations } from "../src/db/schema";

describe("E2E Application Wiring", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("serves health endpoint with 200 OK", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});
