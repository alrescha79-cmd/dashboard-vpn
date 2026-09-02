import { getDb } from "./database";

export async function seedInitialAdmin(username = "admin", password = "AdminPassword123!"): Promise<boolean> {
  const db = getDb();
  const existing = db.query("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return false;
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
  db.query(`
    INSERT INTO users (username, password_hash, role, reseller_level, saldo, display_name, needs_setup)
    VALUES (?, ?, 'admin', 'platinum', 1000000, 'Super Administrator', 1)
  `).run(username, passwordHash);

  return true;
}

if (import.meta.main) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASS || "AdminPassword123!";
  seedInitialAdmin(user, pass).then((created) => {
    if (created) console.log(`✅ Admin user '${user}' created.`);
    else console.log(`ℹ️ Admin user '${user}' already exists.`);
  });
}
