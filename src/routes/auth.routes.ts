import { Elysia, t } from "elysia";
import { authPlugin, hashPassword, verifyPassword, findUserById } from "../lib/auth";
import { getDb } from "../db/database";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(authPlugin)
  .post(
    "/register",
    async ({ body, set }) => {
      const db = getDb();
      const existing = db.query("SELECT id FROM users WHERE username = ?").get(body.username);
      if (existing) {
        set.status = 400;
        return { error: "Username sudah terdaftar" };
      }

      if (body.telegram_id) {
        const existingTg = db.query("SELECT id FROM users WHERE telegram_id = ?").get(body.telegram_id);
        if (existingTg) {
          set.status = 400;
          return { error: "Telegram ID sudah terhubung dengan akun lain" };
        }
      }

      const passwordHash = await hashPassword(body.password);
      const res = db.query(
        "INSERT INTO users (username, password_hash, telegram_id, display_name) VALUES (?, ?, ?, ?) RETURNING id"
      ).get(body.username, passwordHash, body.telegram_id || null, body.display_name || body.username) as { id: number };

      const user = findUserById(res.id);
      set.status = 201;
      return { success: true, user };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 20 }),
        password: t.String({ minLength: 6 }),
        telegram_id: t.Optional(t.Number()),
        display_name: t.Optional(t.String())
      })
    }
  )
  .post(
    "/login",
    async ({ body, jwt, cookie: { auth_token }, set }) => {
      const db = getDb();
      const user = db.query("SELECT id, password_hash FROM users WHERE username = ?").get(body.username) as {
        id: number;
        password_hash: string;
      } | null;

      if (!user) {
        set.status = 401;
        return { error: "Username atau password salah" };
      }

      const match = await verifyPassword(body.password, user.password_hash);
      if (!match) {
        set.status = 401;
        return { error: "Username atau password salah" };
      }

      const token = await jwt.sign({ sub: String(user.id) });
      auth_token.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
        sameSite: "lax"
      });

      const safeUser = findUserById(user.id);
      return { success: true, user: safeUser };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String()
      })
    }
  )
  .get("/me", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    return { user };
  })
  .post(
    "/setup-credentials",
    async ({ user, body, set }) => {
      if (!user || user.role !== "admin" || !user.needs_setup) {
        set.status = 403;
        return { error: "Tidak diizinkan atau setup sudah selesai" };
      }
      if (body.newUsername.length < 3 || body.newUsername.length > 20) {
        set.status = 400;
        return { error: "Username harus 3-20 karakter huruf/angka" };
      }
      if (body.newPassword.length < 6) {
        set.status = 400;
        return { error: "Password minimal 6 karakter" };
      }
      const db = getDb();
      // Check username collision if changed
      if (body.newUsername !== user.username) {
        const occupied = db.query("SELECT id FROM users WHERE username = ?").get(body.newUsername);
        if (occupied) {
          set.status = 400;
          return { error: "Username baru sudah dipakai" };
        }
      }
      const hash = await hashPassword(body.newPassword);
      db.run(
        "UPDATE users SET username = ?, password_hash = ?, needs_setup = 0 WHERE id = ?",
        [body.newUsername, hash, user.id]
      );
      const safe = findUserById(user.id);
      return { success: true, user: safe };
    },
    {
      body: t.Object({
        newUsername: t.String(),
        newPassword: t.String()
      })
    }
  )
  .post("/logout", ({ cookie: { auth_token } }) => {
    auth_token.remove();
    return { success: true };
  });
