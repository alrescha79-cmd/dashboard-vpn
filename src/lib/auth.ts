import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { getDb } from "../db/database";
import { config } from "../config";
import type { UserRole, ResellerLevel } from "./pricing";

export interface SafeUser {
  id: number;
  username: string;
  telegram_id: number | null;
  saldo: number;
  role: UserRole;
  reseller_level: ResellerLevel;
  has_trial: number;
  display_name: string | null;
  needs_setup: number;
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export function findUserById(id: number): SafeUser | null {
  const db = getDb();
  return (
    db
      .query(
        "SELECT id, username, telegram_id, saldo, role, reseller_level, has_trial, display_name, needs_setup FROM users WHERE id = ?"
      )
      .get(id) as SafeUser | null
  );
}

export const authPlugin = new Elysia({ name: "auth" })
  .use(jwt({ name: "jwt", secret: config.JWT_SECRET }))
  .derive({ as: "scoped" }, async ({ jwt, cookie: { auth_token } }) => {
    const token = auth_token?.value;
    if (!token) return { user: null };
    try {
      const payload = (await jwt.verify(token)) as { sub?: number | string } | false;
      if (!payload || !payload.sub) return { user: null };
      const user = findUserById(Number(payload.sub));
      return { user };
    } catch {
      return { user: null };
    }
  });
