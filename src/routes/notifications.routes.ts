import { Elysia } from "elysia";
import { authPlugin } from "../lib/auth";
import { getDb } from "../db/database";

export const notificationsRoutes = new Elysia({ prefix: "/api/notifications" })
  .use(authPlugin)
  .get("/", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const rows = db.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").all(user.id);
    return { notifications: rows };
  })
  .post("/mark-all-read", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    db.run("UPDATE notifications SET read = 1 WHERE user_id = ?", [user.id]);
    return { success: true };
  });
