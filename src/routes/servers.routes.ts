import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { getDb } from "../db/database";
import { executeSSHCommand } from "../lib/ssh";

export const serversRoutes = new Elysia({ prefix: "/api/servers" })
  .use(authPlugin)
  .get("/", () => {
    const db = getDb();
    const rows = db.query(`
      SELECT id, domain, user_ssh, port, harga, nama_server, quota, iplimit, batas_create_akun, total_create_akun, isp, lokasi, created_at
      FROM servers
      ORDER BY id ASC
    `).all();
    return { servers: rows };
  })
  .post(
    "/admin",
    async ({ user, body, set }) => {
      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden: Admin only" };
      }
      const db = getDb();
      try {
        db.query(`
          INSERT INTO servers (domain, auth, user_ssh, port, harga, nama_server, quota, iplimit, batas_create_akun, isp, lokasi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          body.domain,
          body.auth,
          body.user_ssh || "root",
          body.port || 22,
          body.harga,
          body.nama_server,
          body.quota || 0,
          body.iplimit || 0,
          body.batas_create_akun || 100,
          body.isp || "Tidak diketahui",
          body.lokasi || "Tidak diketahui"
        );
        return { success: true };
      } catch (e) {
        set.status = 400;
        return { error: (e as Error).message };
      }
    },
    {
      body: t.Object({
        domain: t.String(),
        auth: t.String(),
        user_ssh: t.Optional(t.String()),
        port: t.Optional(t.Number()),
        harga: t.Number(),
        nama_server: t.String(),
        quota: t.Optional(t.Number()),
        iplimit: t.Optional(t.Number()),
        batas_create_akun: t.Optional(t.Number()),
        isp: t.Optional(t.String()),
        lokasi: t.Optional(t.String())
      })
    }
  )
  .post("/admin/:id/test", async ({ user, params, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const db = getDb();
    const server = db.query("SELECT * FROM servers WHERE id = ?").get(params.id) as any;
    if (!server) {
      set.status = 404;
      return { error: "Server tidak ditemukan" };
    }
    try {
      const res = await executeSSHCommand(server, "uname -a && free -m", 10000);
      return { success: res.code === 0, output: res.stdout };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  })
  .put(
    "/admin/:id",
    async ({ user, params, body, set }) => {
      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Forbidden: Admin only" };
      }
      const db = getDb();
      const existing = db.query("SELECT id FROM servers WHERE id = ?").get(params.id);
      if (!existing) {
        set.status = 404;
        return { error: "Server tidak ditemukan" };
      }
      try {
        db.run(
          "UPDATE servers SET domain = ?, auth = COALESCE(?, auth), user_ssh = ?, port = ?, harga = ?, nama_server = ?, quota = ?, iplimit = ?, batas_create_akun = ?, isp = ?, lokasi = ? WHERE id = ?",
          [
            body.domain,
            body.auth || null,
            body.user_ssh || "root",
            body.port || 22,
            body.harga,
            body.nama_server,
            body.quota ?? 0,
            body.iplimit ?? 0,
            body.batas_create_akun ?? 100,
            body.isp || "Tidak diketahui",
            body.lokasi || "Tidak diketahui",
            params.id
          ]
        );
        return { success: true };
      } catch (e) {
        set.status = 400;
        return { error: (e as Error).message };
      }
    },
    {
      body: t.Object({
        domain: t.String(),
        auth: t.Optional(t.String()),
        user_ssh: t.Optional(t.String()),
        port: t.Optional(t.Number()),
        harga: t.Number(),
        nama_server: t.String(),
        quota: t.Optional(t.Number()),
        iplimit: t.Optional(t.Number()),
        batas_create_akun: t.Optional(t.Number()),
        isp: t.Optional(t.String()),
        lokasi: t.Optional(t.String())
      })
    }
  )
  .delete("/admin/:id", ({ user, params, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const db = getDb();
    db.run("DELETE FROM servers WHERE id = ?", [params.id]);
    return { success: true };
  });
