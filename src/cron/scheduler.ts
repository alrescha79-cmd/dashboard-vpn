import cron from "node-cron";
import { getDb } from "../db/database";

export function resetDailyTrials(): void {
  const db = getDb();
  db.run("UPDATE users SET trial_count_today = 0, last_trial_date = date('now')");
  console.log("⏰ Daily trial counters reset.");
}

export function cleanExpiredAccounts(): number {
  const db = getDb();
  const res = db.run(`
    UPDATE accounts
    SET status = 'expired'
    WHERE status = 'active' AND expired_at IS NOT NULL AND date(expired_at) <= date('now', '-3 days')
  `);
  return res.changes;
}

export function sweepStaleDeposits(): void {
  const db = getDb();
  // Mark deposits older than 24 hours as expired
  db.run(`
    UPDATE deposits
    SET status = 'expired'
    WHERE status = 'pending' AND created_at < ?
  `, [Date.now() - 86400000]);
}

export function resetMonthlyCommissions(): void {
  const db = getDb();
  db.run("DELETE FROM reseller_sales");
  db.run("UPDATE users SET reseller_level = 'silver' WHERE role = 'reseller'");
  console.log("⏰ Monthly reseller commissions reset.");
}

export function startCronJobs(): void {
  // 00:00 Daily trial reset
  cron.schedule("0 0 * * *", () => {
    resetDailyTrials();
  });

  // 02:00 Daily expired accounts sweep
  cron.schedule("0 2 * * *", () => {
    const count = cleanExpiredAccounts();
    console.log(`⏰ Swept ${count} expired accounts.`);
  });

  // Every 10 minutes: sweep stale pending deposits
  cron.schedule("*/10 * * * *", () => {
    sweepStaleDeposits();
  });

  // 1st of every month at 01:00: reset commissions
  cron.schedule("0 1 1 * *", () => {
    resetMonthlyCommissions();
  });

  console.log("✅ Cron schedulers active.");
}
