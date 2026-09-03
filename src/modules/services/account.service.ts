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

  const server = db.query(`
    SELECT s.*, 
      COUNT(CASE 
        WHEN a.id IS NOT NULL 
          AND a.status = 'active' 
          AND (
            a.expired_at IS NULL OR 
            (CASE WHEN length(a.expired_at) = 10 THEN date(a.expired_at) >= date('now') ELSE datetime(a.expired_at) > datetime('now') END)
          ) 
        THEN 1 
      END) as total_create_akun
    FROM servers s
    LEFT JOIN accounts a ON a.server_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `).get(input.serverId) as any;
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
        JSON.stringify({
          ...(protocolRes.links || {}),
          ...(protocolRes.credentials || {}),
          password: input.password || protocolRes.credentials?.password,
          uuid: protocolRes.credentials?.uuid
        })
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

export async function renewAccount(
  userId: number,
  accountId: string,
  durationDays: number,
  protocolRunner = createVPNAccount
): Promise<{ success: boolean; account?: any; error?: string }> {
  const db = getDb();
  const user = db.query("SELECT id, saldo, role, reseller_level FROM users WHERE id = ?").get(userId) as {
    id: number;
    saldo: number;
    role: UserRole;
    reseller_level: ResellerLevel;
  } | null;
  if (!user) return { success: false, error: "User tidak ditemukan" };

  const acc = db.query(`
    SELECT a.*, s.harga as server_harga, s.domain, s.auth, s.user_ssh, s.port, s.quota, s.iplimit
    FROM accounts a
    JOIN servers s ON a.server_id = s.id
    WHERE a.id = ?
  `).get(accountId) as any;

  if (!acc) return { success: false, error: "Akun tidak ditemukan" };
  if (user.role !== "admin" && acc.owner_user_id !== user.id) {
    return { success: false, error: "Tidak memiliki hak memperpanjang akun ini" };
  }

  const { totalPrice } = calculatePrice({
    serverPrice: acc.server_harga,
    durationDays,
    role: user.role,
    resellerLevel: user.reseller_level,
    protocol: acc.protocol
  });

  if (user.role !== "admin" && user.saldo < totalPrice) {
    return { success: false, error: "Saldo tidak mencukupi untuk memperpanjang akun ini" };
  }

  // Deduct saldo initially
  if (totalPrice > 0) {
    db.run("UPDATE users SET saldo = saldo - ? WHERE id = ?", [totalPrice, user.id]);
  }

  // Calculate new expiry date based on existing or now
  const baseDate = acc.expired_at && new Date(acc.expired_at) > new Date() ? new Date(acc.expired_at) : new Date();
  baseDate.setDate(baseDate.getDate() + durationDays);
  const newExpiredAt = baseDate.toISOString().replace("T", " ").substring(0, 19);

  // Run protocol create/renew on server
  const parsedConfig = (() => {
    try {
      return JSON.parse(acc.config_json || "{}");
    } catch {
      return {};
    }
  })();

  const protocolRes: ProtocolResult = await protocolRunner(acc.protocol, acc, {
    username: acc.username,
    password: parsedConfig.password,
    durationDays,
    quotaGb: acc.quota,
    iplimit: acc.iplimit
  });

  if (!protocolRes.success) {
    if (totalPrice > 0) {
      db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [totalPrice, user.id]);
    }
    return { success: false, error: protocolRes.error || "Gagal memperpanjang akun di server" };
  }

  const commission = calculateCommission({
    serverPrice: acc.server_harga,
    durationDays,
    role: user.role
  });

  db.transaction(() => {
    db.run(
      "INSERT INTO invoices (user_id, layanan, akun, hari, harga, komisi) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, acc.protocol, acc.username, durationDays, totalPrice, commission]
    );

    db.run(
      "UPDATE accounts SET expired_at = ?, status = 'active', expiry_warning_3d_sent = 0, expiry_warning_1d_sent = 0, expired_notified = 0 WHERE id = ?",
      [newExpiredAt, acc.id]
    );

    if (commission > 0 && user.role === "reseller") {
      db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [commission, user.id]);
      db.run("INSERT INTO reseller_sales (reseller_id, buyer_id, akun_type, username, komisi) VALUES (?, ?, ?, ?, ?)", [
        user.id,
        user.id,
        acc.protocol,
        acc.username,
        commission
      ]);
    }
  })();

  return {
    success: true,
    account: {
      ...acc,
      expired_at: newExpiredAt,
      status: "active"
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

  const server = db.query(`
    SELECT s.*, 
      COUNT(CASE 
        WHEN a.id IS NOT NULL 
          AND a.status = 'active' 
          AND (
            a.expired_at IS NULL OR 
            (CASE WHEN length(a.expired_at) = 10 THEN date(a.expired_at) >= date('now') ELSE datetime(a.expired_at) > datetime('now') END)
          ) 
        THEN 1 
      END) as total_create_akun
    FROM servers s
    LEFT JOIN accounts a ON a.server_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `).get(serverId) as any;
  if (!server) return { success: false, error: "Server tidak ditemukan" };
  if (server.total_create_akun >= server.batas_create_akun && server.batas_create_akun > 0) {
    return { success: false, error: "Server sudah penuh (kapasitas maksimal tercapai)" };
  }

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

  const expDate = new Date();
  expDate.setHours(expDate.getHours() + 1);
  const trialExpiredAt = expDate.toISOString().replace("T", " ").substring(0, 19);

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
        trialExpiredAt,
        JSON.stringify({
          ...(protocolRes.credentials || {}),
          ...(protocolRes.links || {}),
          password: effectivePassword,
          uuid: protocolRes.credentials?.uuid
        })
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
      expired_at: trialExpiredAt,
      credentials: {
        ...mergedCreds,
        password: effectivePassword,
        uuid: mergedCreds.uuid
      },
      links: mergedLinks
    }
  };
}
