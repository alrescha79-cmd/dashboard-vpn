import { getDb } from "../../db/database";
import { calculatePrice, calculateCommission, getResellerTier, type UserRole, type ResellerLevel } from "../../lib/pricing";
import { createVPNAccount } from "../protocols";
import type { ProtocolResult } from "../protocols/types";

export interface BuyAccountInput {
  userId: number;
  serverId: number;
  protocol: string;
  username: string;
  password?: string;
  durationDays: number;
}

export async function buyAccount(
  input: BuyAccountInput,
  protocolRunner = createVPNAccount
): Promise<{ success: boolean; account?: any; error?: string }> {
  const db = getDb();

  const user = db.query("SELECT id, saldo, role, reseller_level FROM users WHERE id = ?").get(input.userId) as {
    id: number;
    saldo: number;
    role: UserRole;
    reseller_level: ResellerLevel;
  } | null;
  if (!user) return { success: false, error: "User tidak ditemukan" };

  const server = db.query("SELECT * FROM servers WHERE id = ?").get(input.serverId) as any;
  if (!server) return { success: false, error: "Server tidak ditemukan" };

  if (server.total_create_akun >= server.batas_create_akun && server.batas_create_akun > 0) {
    return { success: false, error: "Server sudah penuh (kapasitas maksimal tercapai)" };
  }

  const { totalPrice } = calculatePrice({
    serverPrice: server.harga,
    durationDays: input.durationDays,
    role: user.role,
    resellerLevel: user.reseller_level,
    protocol: input.protocol
  });

  if (user.role !== "admin" && user.saldo < totalPrice) {
    return { success: false, error: "Saldo tidak mencukupi untuk membeli akun ini" };
  }

  // Deduct saldo initially
  if (totalPrice > 0) {
    db.run("UPDATE users SET saldo = saldo - ? WHERE id = ?", [totalPrice, user.id]);
  }

  // Run SSH command
  const protocolRes: ProtocolResult = await protocolRunner(input.protocol, server, {
    username: input.username,
    password: input.password,
    durationDays: input.durationDays,
    quotaGb: server.quota,
    iplimit: server.iplimit
  });

  if (!protocolRes.success) {
    // Refund on failure
    if (totalPrice > 0) {
      db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [totalPrice, user.id]);
    }
    return { success: false, error: protocolRes.error || "Gagal membuat akun VPN" };
  }

  // Success: persist invoice, active usernames, and account
  const commission = calculateCommission({
    serverPrice: server.harga,
    durationDays: input.durationDays,
    role: user.role
  });

  const accountId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  db.transaction(() => {
    db.run(
      "INSERT INTO invoices (user_id, layanan, akun, hari, harga, komisi) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, input.protocol, input.username, input.durationDays, totalPrice, commission]
    );

    db.run(
      "INSERT INTO accounts (id, username, protocol, server_id, owner_user_id, expired_at, status, config_json) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
      [
        accountId,
        input.username,
        input.protocol.toUpperCase(),
        server.id,
        user.id,
        protocolRes.expired_at,
        JSON.stringify(protocolRes.links || protocolRes.credentials || {})
      ]
    );

    db.run("INSERT OR REPLACE INTO active_usernames (username, protocol) VALUES (?, ?)", [input.username, input.protocol]);
    db.run("UPDATE servers SET total_create_akun = total_create_akun + 1 WHERE id = ?", [server.id]);

    if (commission > 0 && user.role === "reseller") {
      db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [commission, user.id]);
      db.run("INSERT INTO reseller_sales (reseller_id, buyer_id, akun_type, username, komisi) VALUES (?, ?, ?, ?, ?)", [
        user.id,
        user.id,
        input.protocol,
        input.username,
        commission
      ]);

      const sumRes = db.query("SELECT SUM(komisi) as total FROM reseller_sales WHERE reseller_id = ?").get(user.id) as any;
      const newTier = getResellerTier(sumRes?.total || 0);
      if (newTier !== user.reseller_level) {
        db.run("UPDATE users SET reseller_level = ? WHERE id = ?", [newTier, user.id]);
      }
    }
  })();

  // Return structured credentials+links for rich details card
  const mergedLinks = protocolRes.links || {};
  const mergedCreds = protocolRes.credentials || {};
  return {
    success: true,
    account: {
      id: accountId,
      username: input.username,
      protocol: input.protocol,
      expired_at: protocolRes.expired_at,
      credentials: mergedCreds,
      links: mergedLinks
    }
  };
}

export async function createTrialAccount(
  userId: number,
  serverId: number,
  protocol: string,
  username: string,
  password: string | undefined,
  protocolRunner = createVPNAccount
): Promise<{ success: boolean; account?: any; error?: string }> {
  const db = getDb();
  const user = db.query("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) return { success: false, error: "User tidak ditemukan" };

  const limitToday = user.role === "admin" ? Infinity : user.role === "reseller" ? 10 : 2;
  if (user.trial_count_today >= limitToday) {
    return { success: false, error: `Batas trial harian tercapai (${limitToday}x / hari)` };
  }

  const server = db.query("SELECT * FROM servers WHERE id = ?").get(serverId) as any;
  if (!server) return { success: false, error: "Server tidak ditemukan" };

  const effectivePassword = protocol.toLowerCase() === "ssh"
    ? (password && password.length >= 4 ? password : `${username}_pass`)
    : undefined;

  const protocolRes = await protocolRunner(protocol, server, {
    username,
    password: effectivePassword,
    durationDays: 1,
    quotaGb: server.quota || 0,
    iplimit: server.iplimit || 1
  });

  if (!protocolRes.success) {
    return { success: false, error: protocolRes.error || "Gagal membuat akun trial" };
  }

  const accountId = `trial-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  db.transaction(() => {
    db.run(
      "INSERT INTO accounts (id, username, protocol, server_id, owner_user_id, expired_at, status, config_json) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
      [
        accountId,
        username,
        protocol.toUpperCase(),
        server.id,
        user.id,
        protocolRes.expired_at,
        JSON.stringify({ ...(protocolRes.credentials || {}), ...(protocolRes.links || {}) })
      ]
    );
    db.run("UPDATE users SET trial_count_today = trial_count_today + 1, has_trial = 1, last_trial_date = date('now') WHERE id = ?", [user.id]);
    db.run("INSERT INTO trial_logs (user_id, username, jenis) VALUES (?, ?, ?)", [user.id, username, protocol]);
  })();

  const mergedLinks = protocolRes.links || {};
  const mergedCreds = protocolRes.credentials || {};
  return {
    success: true,
    account: {
      id: accountId,
      username,
      protocol,
      expired_at: protocolRes.expired_at,
      credentials: mergedCreds,
      links: mergedLinks
    }
  };
}
