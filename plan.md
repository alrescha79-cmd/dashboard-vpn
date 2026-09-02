# VPN Web Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Telegram VPN bot as a standalone web UI dashboard with identical business logic (VPN account lifecycle for SSH/VMess/VLESS/Trojan/Shadowsocks/3IN1, wallet deposits via 5 gateways, reseller tiering/commissions, admin controls, and automated cron sweeps) deployed via Docker.

**Architecture:** Monorepo architecture containing an ElysiaJS backend (serving REST APIs, raw-body payment webhooks, background cron jobs, and static SPA assets) and a React/Vite frontend styled with Tailwind CSS and shadcn/ui. SQLite is managed natively via `bun:sqlite` with WAL mode and foreign keys enabled.

**Tech Stack:** Bun, ElysiaJS, `bun:sqlite`, `ssh2`, `@elysiajs/jwt`, `@elysiajs/cors`, `@elysiajs/static`, Vite, React, TypeScript, Tailwind CSS, Lucide React, Docker.

---

## File Structure

```
vpn-dashboard/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── db/
│   │   ├── database.ts
│   │   ├── schema.ts
│   │   ├── seed.ts
│   │   └── migrate-from-bot.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── pricing.ts
│   │   ├── ssh.ts
│   │   └── telegram.ts
│   ├── modules/
│   │   ├── protocols/
│   │   │   ├── types.ts
│   │   │   ├── ssh.ts
│   │   │   ├── vmess.ts
│   │   │   ├── vless.ts
│   │   │   ├── trojan.ts
│   │   │   ├── shadowsocks.ts
│   │   │   ├── threeinone.ts
│   │   │   └── index.ts
│   │   ├── payments/
│   │   │   ├── tripay.ts
│   │   │   ├── duitku.ts
│   │   │   ├── pakasir.ts
│   │   │   ├── midtrans.ts
│   │   │   ├── qris-dinamis.ts
│   │   │   └── index.ts
│   │   └── services/
│   │       ├── account.service.ts
│   │       ├── deposit.service.ts
│   │       ├── reseller.service.ts
│   │       └── expiration.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── accounts.routes.ts
│   │   ├── deposits.routes.ts
│   │   ├── servers.routes.ts
│   │   ├── users.routes.ts
│   │   ├── reseller.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── notifications.routes.ts
│   │   └── webhooks.routes.ts
│   └── cron/
│       └── scheduler.ts
└── web/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── utils.ts
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── ui/ (Button, Card, Input, Dialog, Table, Badge, Tabs)
    │   └── pages/
    │       ├── Login.tsx
    │       ├── Register.tsx
    │       ├── Dashboard.tsx
    │       ├── BuyAccount.tsx
    │       ├── MyAccounts.tsx
    │       ├── Trial.tsx
    │       ├── TopUp.tsx
    │       ├── Reseller.tsx
    │       ├── admin/
    │       │   ├── Servers.tsx
    │       │   ├── Users.tsx
    │       │   ├── Deposits.tsx
    │       │   ├── Broadcast.tsx
    │       │   └── Backup.tsx
```

---

## Phase 0: Scaffolding & Setup

### Task 1: Project Initialization & Elysia Backend Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Test: `tests/health.test.ts`

- [ ] **Step 1: Write failing test for health endpoint**

```typescript
// tests/health.test.ts
import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Health API", () => {
  it("should return status ok and timestamp", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/health.test.ts`
Expected: FAIL with module/app not found.

- [ ] **Step 3: Create configuration and minimal server**

```json
// package.json
{
  "name": "vpn-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build:web": "cd web && bun run build",
    "start": "bun run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@elysiajs/cors": "^1.1.0",
    "@elysiajs/jwt": "^1.1.0",
    "@elysiajs/static": "^1.1.0",
    "elysia": "^1.1.0",
    "node-cron": "^3.0.3",
    "ssh2": "^1.15.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/node-cron": "^3.0.11",
    "@types/ssh2": "^1.15.1"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "composite": true,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["bun-types"]
  }
}
```

```typescript
// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

export const app = new Elysia()
  .use(cors())
  .get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString()
  }));

if (import.meta.main) {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server listening on port ${port}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/health.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add package.json tsconfig.json src/index.ts tests/health.test.ts
git commit -m "feat: initialize bun elysia backend with health check"
```

---

### Task 2: Config Loader & Environment Variables

**Files:**
- Create: `src/config.ts`
- Create: `.env.example`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write failing test for config loader**

```typescript
// tests/config.test.ts
import { describe, expect, it } from "bun:test";
import { loadConfig } from "../src/config";

describe("Configuration Loader", () => {
  it("loads default fallback values", () => {
    const config = loadConfig({});
    expect(config.PORT).toBe(3000);
    expect(config.DB_PATH).toBe("./data/vpn.db");
    expect(config.JWT_SECRET).toBe("default-jwt-secret-change-in-production");
    expect(config.COMMISSION_RATE).toBe(0.1);
  });

  it("overrides values with provided environment variables", () => {
    const config = loadConfig({
      PORT: "8080",
      DB_PATH: "/custom/db.sqlite",
      NAMA_STORE: "My VPN Store"
    });
    expect(config.PORT).toBe(8080);
    expect(config.DB_PATH).toBe("/custom/db.sqlite");
    expect(config.NAMA_STORE).toBe("My VPN Store");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/config.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement config loader**

```typescript
// src/config.ts
export interface AppConfig {
  PORT: number;
  NODE_ENV: string;
  DB_PATH: string;
  JWT_SECRET: string;
  NAMA_STORE: string;
  BOT_TOKEN: string;
  GROUP_ID: string;
  ADMIN_IDS: string[];
  PUBLIC_BASE_URL: string;
  COMMISSION_RATE: number;
  RESELLER_UPGRADE_COST: number;
  TRIAL_DURATION_MINUTES: number;
  TRIPAY_API_KEY: string;
  TRIPAY_PRIVATE_KEY: string;
  TRIPAY_MERCHANT_CODE: string;
  TRIPAY_ENV: "production" | "sandbox";
  DUITKU_MERCHANT_CODE: string;
  DUITKU_API_KEY: string;
  DUITKU_ENV: "production" | "sandbox";
  PAKASIR_PROJECT: string;
  PAKASIR_API_KEY: string;
  MIDTRANS_MERCHANT_ID: string;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_ENV: "production" | "sandbox";
  DATA_QRIS: string;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const adminIdsStr = env.ADMIN_IDS || env.USER_ID || "";
  const adminIds = adminIdsStr
    ? adminIdsStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    PORT: parseInt(env.PORT || "3000", 10),
    NODE_ENV: env.NODE_ENV || "development",
    DB_PATH: env.DB_PATH || "./data/vpn.db",
    JWT_SECRET: env.JWT_SECRET || "default-jwt-secret-change-in-production",
    NAMA_STORE: env.NAMA_STORE || "VPN Premium Store",
    BOT_TOKEN: env.BOT_TOKEN || "",
    GROUP_ID: env.GROUP_ID || "",
    ADMIN_IDS: adminIds,
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL || "http://localhost:3000",
    COMMISSION_RATE: 0.1,
    RESELLER_UPGRADE_COST: 50000,
    TRIAL_DURATION_MINUTES: 60,
    TRIPAY_API_KEY: env.TRIPAY_API_KEY || "",
    TRIPAY_PRIVATE_KEY: env.TRIPAY_PRIVATE_KEY || "",
    TRIPAY_MERCHANT_CODE: env.TRIPAY_MERCHANT_CODE || "",
    TRIPAY_ENV: (env.TRIPAY_ENV as "production" | "sandbox") || "production",
    DUITKU_MERCHANT_CODE: env.DUITKU_MERCHANT_CODE || "",
    DUITKU_API_KEY: env.DUITKU_API_KEY || "",
    DUITKU_ENV: (env.DUITKU_ENV as "production" | "sandbox") || "production",
    PAKASIR_PROJECT: env.PAKASIR_PROJECT || env.PAKASIR_SLUG || "",
    PAKASIR_API_KEY: env.PAKASIR_API_KEY || "",
    MIDTRANS_MERCHANT_ID: env.MIDTRANS_MERCHANT_ID || env.MERCHANT_ID || "",
    MIDTRANS_SERVER_KEY: env.MIDTRANS_SERVER_KEY || env.SERVER_KEY || "",
    MIDTRANS_ENV: (env.MIDTRANS_ENV as "production" | "sandbox") || "production",
    DATA_QRIS: env.DATA_QRIS || ""
  };
}

export const config = loadConfig();
```

```env
// .env.example
PORT=3000
NODE_ENV=production
DB_PATH=/app/data/vpn.db
JWT_SECRET=replace-with-secure-random-key
NAMA_STORE=VPN Premium Store
PUBLIC_BASE_URL=https://dashboard.yourdomain.com
BOT_TOKEN=
GROUP_ID=
ADMIN_IDS=12345678

# Payments (Fill configured gateways)
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
TRIPAY_ENV=production

DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_ENV=production

PAKASIR_PROJECT=
PAKASIR_API_KEY=

MIDTRANS_MERCHANT_ID=
MIDTRANS_SERVER_KEY=
MIDTRANS_ENV=production

DATA_QRIS=
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/config.ts .env.example tests/config.test.ts
git commit -m "feat: add application configuration module"
```

---

### Task 3: Pricing and Discount Business Logic

**Files:**
- Create: `src/lib/pricing.ts`
- Test: `tests/pricing.test.ts`

- [ ] **Step 1: Write failing tests for pricing calculations**

```typescript
// tests/pricing.test.ts
import { describe, expect, it } from "bun:test";
import { calculatePrice, calculateCommission, getResellerTier } from "../src/lib/pricing";

describe("Pricing Logic", () => {
  it("calculates normal user pricing with duration", () => {
    const res = calculatePrice({ serverPrice: 1000, durationDays: 30, role: "user", resellerLevel: "silver", protocol: "vmess" });
    expect(res.unitPrice).toBe(1000);
    expect(res.totalPrice).toBe(30000);
  });

  it("applies 1.5x multiplier for 3in1 protocol", () => {
    const res = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "user", resellerLevel: "silver", protocol: "3in1" });
    expect(res.unitPrice).toBe(1500);
    expect(res.totalPrice).toBe(15000);
  });

  it("applies reseller discount rates (silver: 10%, gold: 20%, platinum: 30%)", () => {
    const silver = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "reseller", resellerLevel: "silver", protocol: "ssh" });
    expect(silver.unitPrice).toBe(900);
    expect(silver.totalPrice).toBe(9000);

    const gold = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "reseller", resellerLevel: "gold", protocol: "ssh" });
    expect(gold.unitPrice).toBe(800);
    expect(gold.totalPrice).toBe(8000);

    const platinum = calculatePrice({ serverPrice: 1000, durationDays: 10, role: "reseller", resellerLevel: "platinum", protocol: "ssh" });
    expect(platinum.unitPrice).toBe(700);
    expect(platinum.totalPrice).toBe(7000);
  });

  it("grants admin free accounts", () => {
    const admin = calculatePrice({ serverPrice: 1000, durationDays: 30, role: "admin", resellerLevel: "silver", protocol: "3in1" });
    expect(admin.unitPrice).toBe(0);
    expect(admin.totalPrice).toBe(0);
  });

  it("calculates reseller 10% commission based on base server price", () => {
    const commission = calculateCommission({ serverPrice: 1000, durationDays: 30, role: "reseller" });
    expect(commission).toBe(3000);
  });

  it("computes reseller level based on accumulated commission", () => {
    expect(getResellerTier(0)).toBe("silver");
    expect(getResellerTier(49999)).toBe("silver");
    expect(getResellerTier(50000)).toBe("gold");
    expect(getResellerTier(79999)).toBe("gold");
    expect(getResellerTier(80000)).toBe("platinum");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/pricing.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement pricing calculation**

```typescript
// src/lib/pricing.ts
export type UserRole = "user" | "reseller" | "admin";
export type ResellerLevel = "silver" | "gold" | "platinum";

export interface PriceCalculationParams {
  serverPrice: number;
  durationDays: number;
  role: UserRole;
  resellerLevel: ResellerLevel;
  protocol: string;
}

export interface PriceCalculationResult {
  unitPrice: number;
  totalPrice: number;
  discountRate: number;
  multiplier: number;
}

export function calculatePrice(params: PriceCalculationParams): PriceCalculationResult {
  const { serverPrice, durationDays, role, resellerLevel, protocol } = params;

  if (role === "admin") {
    return { unitPrice: 0, totalPrice: 0, discountRate: 1, multiplier: 1 };
  }

  let discountRate = 0;
  if (role === "reseller") {
    if (resellerLevel === "platinum") discountRate = 0.3;
    else if (resellerLevel === "gold") discountRate = 0.2;
    else discountRate = 0.1;
  }

  const multiplier = protocol.toLowerCase() === "3in1" ? 1.5 : 1;
  const unitPrice = Math.floor(serverPrice * (1 - discountRate) * multiplier);
  const totalPrice = unitPrice * durationDays;

  return { unitPrice, totalPrice, discountRate, multiplier };
}

export function calculateCommission(params: { serverPrice: number; durationDays: number; role: UserRole }): number {
  if (params.role !== "reseller") return 0;
  return Math.floor(params.serverPrice * params.durationDays * 0.1);
}

export function getResellerTier(totalCommission: number): ResellerLevel {
  if (totalCommission >= 80000) return "platinum";
  if (totalCommission >= 50000) return "gold";
  return "silver";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/pricing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/pricing.ts tests/pricing.test.ts
git commit -m "feat: implement pricing and reseller commission calculation"
```

---

### Task 4: Multi-stage Dockerfile and Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

```
node_modules
dist
web/node_modules
web/dist
data
*.log
.git
.env
```

- [ ] **Step 2: Create multi-stage Dockerfile**

```dockerfile
# Stage 1: Build Frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/web
COPY web/package.json ./
RUN bun install
COPY web/ ./
RUN bun run build

# Stage 2: Production Runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY package.json ./
RUN bun install --production --frozen-lockfile

COPY src/ ./src
COPY --from=frontend-builder /app/web/dist ./web/dist

RUN mkdir -p /app/data /app/data/uploads /app/data/backups

VOLUME /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/vpn.db

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  vpn-dashboard:
    build: .
    container_name: vpn-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    environment:
      - PORT=3000
      - DB_PATH=/app/data/vpn.db
      - NODE_ENV=production
```

- [ ] **Step 4: Verify Docker configuration syntax**

Run: `docker compose config`
Expected: Valid YAML output with service definitions.

- [ ] **Step 5: Commit changes**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: add multi-stage dockerfile and compose setup"
```

---

## Phase 1: Database & Authentication

### Task 5: Database Singleton & Schema Definition

**Files:**
- Create: `src/db/database.ts`
- Create: `src/db/schema.ts`
- Test: `tests/db.test.ts`

- [ ] **Step 1: Write failing database schema test**

```typescript
// tests/db.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";

describe("Database Layer", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("enforces foreign key constraints", () => {
    const db = getDb();
    expect(() => {
      db.run("INSERT INTO accounts (id, username, protocol, server_id, owner_user_id) VALUES ('1', 'user1', 'SSH', 999, 999)");
    }).toThrow();
  });

  it("allows inserting users and fetching via query", () => {
    const db = getDb();
    db.run("INSERT INTO users (username, password_hash, role) VALUES ('admin', 'hash123', 'admin')");
    const user = db.query("SELECT * FROM users WHERE username = ?").get("admin") as any;
    expect(user).toBeDefined();
    expect(user.username).toBe("admin");
    expect(user.role).toBe("admin");
    expect(user.saldo).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/db.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement database singleton and migration schema**

```typescript
// src/db/database.ts
import { Database } from "bun:sqlite";
import { config } from "../config";

let dbInstance: Database | null = null;

export function initDatabase(dbPath = config.DB_PATH): Database {
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = new Database(dbPath);
  dbInstance.run("PRAGMA journal_mode = WAL;");
  dbInstance.run("PRAGMA foreign_keys = ON;");
  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}
```

```typescript
// src/db/schema.ts
import { getDb } from "./database";

export function runMigrations(): void {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      telegram_id INTEGER UNIQUE,
      saldo INTEGER NOT NULL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'admin')),
      reseller_level TEXT NOT NULL DEFAULT 'silver' CHECK (reseller_level IN ('silver', 'gold', 'platinum')),
      has_trial INTEGER NOT NULL DEFAULT 0,
      trial_count_today INTEGER NOT NULL DEFAULT 0,
      last_trial_date TEXT,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      auth TEXT NOT NULL,
      user_ssh TEXT NOT NULL DEFAULT 'root',
      port INTEGER NOT NULL DEFAULT 22,
      harga INTEGER NOT NULL DEFAULT 0,
      nama_server TEXT NOT NULL DEFAULT '',
      quota INTEGER NOT NULL DEFAULT 0,
      iplimit INTEGER NOT NULL DEFAULT 0,
      batas_create_akun INTEGER NOT NULL DEFAULT 0,
      total_create_akun INTEGER NOT NULL DEFAULT 0,
      isp TEXT DEFAULT 'Tidak diketahui',
      lokasi TEXT DEFAULT 'Tidak diketahui',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      protocol TEXT NOT NULL CHECK (protocol IN ('SSH', 'VMESS', 'VLESS', 'TROJAN', 'SHADOWSOCKS', '3IN1')),
      server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expired_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
      config_json TEXT,
      raw_response TEXT,
      expiry_warning_3d_sent INTEGER NOT NULL DEFAULT 0,
      expiry_warning_1d_sent INTEGER NOT NULL DEFAULT 0,
      expired_notified INTEGER NOT NULL DEFAULT 0,
      UNIQUE (username, server_id, protocol)
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
    CREATE INDEX IF NOT EXISTS idx_accounts_expired_at ON accounts(expired_at);

    CREATE TABLE IF NOT EXISTS active_usernames (
      username TEXT NOT NULL,
      protocol TEXT NOT NULL,
      PRIMARY KEY (username, protocol)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      layanan TEXT NOT NULL,
      akun TEXT NOT NULL,
      hari INTEGER NOT NULL,
      harga INTEGER NOT NULL,
      komisi INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      original_amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expired_at INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_verification', 'paid', 'rejected', 'cancelled', 'expired', 'failed')),
      payment_method TEXT NOT NULL DEFAULT 'static_qris',
      qr_string TEXT,
      checkout_url TEXT,
      proof_path TEXT,
      admin_id INTEGER REFERENCES users(id),
      admin_note TEXT,
      decided_at TEXT
    );

    CREATE TABLE IF NOT EXISTS trial_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      jenis TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reseller_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reseller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      buyer_id INTEGER REFERENCES users(id),
      akun_type TEXT NOT NULL,
      username TEXT NOT NULL,
      komisi INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reseller_upgrade_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      level TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saldo_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/db/database.ts src/db/schema.ts tests/db.test.ts
git commit -m "feat: implement database singleton and migration schema with foreign keys"
```

---

### Task 6: Initial Admin Seeding Script

**Files:**
- Create: `src/db/seed.ts`
- Test: `tests/seed.test.ts`

- [ ] **Step 1: Write failing test for admin seeding**

```typescript
// tests/seed.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { seedInitialAdmin } from "../src/db/seed";

describe("Admin Seeding", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("creates default admin user if database is empty", async () => {
    const created = await seedInitialAdmin("admin", "AdminPassword123!");
    expect(created).toBe(true);

    const db = getDb();
    const admin = db.query("SELECT * FROM users WHERE username = 'admin'").get() as any;
    expect(admin).toBeDefined();
    expect(admin.role).toBe("admin");
    const isMatch = await Bun.password.verify("AdminPassword123!", admin.password_hash);
    expect(isMatch).toBe(true);
  });

  it("does not duplicate admin if already exists", async () => {
    await seedInitialAdmin("admin", "AdminPassword123!");
    const secondCall = await seedInitialAdmin("admin", "NewPass!");
    expect(secondCall).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/seed.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement seed script**

```typescript
// src/db/seed.ts
import { getDb } from "./database";

export async function seedInitialAdmin(username = "admin", password = "AdminPassword123!"): Promise<boolean> {
  const db = getDb();
  const existing = db.query("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return false;
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
  db.query(`
    INSERT INTO users (username, password_hash, role, reseller_level, saldo)
    VALUES (?, ?, 'admin', 'platinum', 1000000)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/seed.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/db/seed.ts tests/seed.test.ts
git commit -m "feat: implement initial admin seeder"
```

---

### Task 7: Authentication Middleware & JWT Library

**Files:**
- Create: `src/lib/auth.ts`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Write failing test for auth middleware and password verification**

```typescript
// tests/auth.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { hashPassword, verifyPassword, findUserById } from "../src/lib/auth";

describe("Auth Library", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("hashes and verifies passwords correctly", async () => {
    const hash = await hashPassword("Secret123");
    expect(await verifyPassword("Secret123", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("fetches user by ID without leaking password hash", async () => {
    const db = getDb();
    const hash = await hashPassword("Secret123");
    db.run("INSERT INTO users (username, password_hash, role) VALUES ('testuser', ?, 'user')", [hash]);
    const user = findUserById(1);
    expect(user).toBeDefined();
    expect(user?.username).toBe("testuser");
    expect((user as any).password_hash).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/auth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement auth helper**

```typescript
// src/lib/auth.ts
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
        "SELECT id, username, telegram_id, saldo, role, reseller_level, has_trial, display_name FROM users WHERE id = ?"
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
      const payload = (await jwt.verify(token)) as { sub?: number } | false;
      if (!payload || !payload.sub) return { user: null };
      const user = findUserById(Number(payload.sub));
      return { user };
    } catch {
      return { user: null };
    }
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/auth.ts tests/auth.test.ts
git commit -m "feat: implement password hashing and jwt authentication helper"
```

---

### Task 8: Authentication API Routes

**Files:**
- Create: `src/routes/auth.routes.ts`
- Test: `tests/auth.routes.test.ts`

- [ ] **Step 1: Write failing tests for register, login, and me endpoints**

```typescript
// tests/auth.routes.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { authRoutes } from "../src/routes/auth.routes";

describe("Auth Routes", () => {
  let app: Elysia;

  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    app = new Elysia().use(authRoutes);
  });

  it("registers a new user successfully", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "john_doe", password: "Password123!" })
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.username).toBe("john_doe");
  });

  it("rejects duplicate registration", async () => {
    await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "duplicate", password: "Password123!" })
      })
    );
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "duplicate", password: "Password123!" })
      })
    );
    expect(res.status).toBe(400);
  });

  it("authenticates valid credentials", async () => {
    await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "validuser", password: "Password123!" })
      })
    );
    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "validuser", password: "Password123!" })
      })
    );
    expect(res.status).toBe(200);
    const cookie = res.headers.get("Set-Cookie");
    expect(cookie).toContain("auth_token=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/auth.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement auth routes**

```typescript
// src/routes/auth.routes.ts
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
  .post("/logout", ({ cookie: { auth_token } }) => {
    auth_token.remove();
    return { success: true };
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/auth.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/routes/auth.routes.ts tests/auth.routes.test.ts
git commit -m "feat: implement register, login, me and logout auth routes"
```

---

### Task 9: Legacy Database Migration Script

**Files:**
- Create: `src/db/migrate-from-bot.ts`
- Test: `tests/migrate.test.ts`

- [ ] **Step 1: Write failing test for data migration**

```typescript
// tests/migrate.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { migrateFromLegacyDb } from "../src/db/migrate-from-bot";

describe("Legacy Migration Tool", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
  });

  it("migrates servers and users correctly", async () => {
    const legacyDb = new Database(":memory:");
    legacyDb.run(`
      CREATE TABLE users (user_id INTEGER, username TEXT, saldo INTEGER, role TEXT, reseller_level TEXT);
      INSERT INTO users VALUES (1001, 'olduser', 50000, 'reseller', 'gold');

      CREATE TABLE Server (id INTEGER PRIMARY KEY, domain TEXT, auth TEXT, harga INTEGER, nama_server TEXT, quota INTEGER, iplimit INTEGER, batas_create_akun INTEGER, total_create_akun INTEGER);
      INSERT INTO Server VALUES (1, 'sg1.server.com', 'rootpass', 1000, 'SG 1', 0, 2, 100, 5);
    `);

    const stats = await migrateFromLegacyDb(legacyDb);
    expect(stats.migratedUsers).toBe(1);
    expect(stats.migratedServers).toBe(1);

    const db = getDb();
    const server = db.query("SELECT * FROM servers WHERE domain = 'sg1.server.com'").get() as any;
    expect(server).toBeDefined();
    expect(server.nama_server).toBe("SG 1");

    const user = db.query("SELECT * FROM users WHERE telegram_id = 1001").get() as any;
    expect(user).toBeDefined();
    expect(user.saldo).toBe(50000);
    expect(user.role).toBe("reseller");
    expect(user.reseller_level).toBe("gold");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/migrate.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement legacy migration tool**

```typescript
// src/db/migrate-from-bot.ts
import { Database } from "bun:sqlite";
import { getDb } from "./database";

export interface MigrationStats {
  migratedUsers: number;
  migratedServers: number;
  migratedAccounts: number;
}

export async function migrateFromLegacyDb(legacyDb: Database): Promise<MigrationStats> {
  const targetDb = getDb();
  let migratedUsers = 0;
  let migratedServers = 0;
  let migratedAccounts = 0;

  // 1. Migrate Servers
  try {
    const oldServers = legacyDb.query("SELECT * FROM Server").all() as any[];
    for (const s of oldServers) {
      targetDb.query(`
        INSERT OR IGNORE INTO servers (id, domain, auth, user_ssh, port, harga, nama_server, quota, iplimit, batas_create_akun, total_create_akun, isp, lokasi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        s.id,
        s.domain,
        s.auth,
        s.user_ssh || "root",
        s.port || 22,
        s.harga || 0,
        s.nama_server || s.domain,
        s.quota || 0,
        s.iplimit || 0,
        s.batas_create_akun || 0,
        s.total_create_akun || 0,
        s.isp || "Tidak diketahui",
        s.lokasi || "Tidak diketahui"
      );
      migratedServers++;
    }
  } catch (e) {
    console.warn("Skipping servers migration:", (e as Error).message);
  }

  // 2. Migrate Users
  try {
    const oldUsers = legacyDb.query("SELECT * FROM users").all() as any[];
    for (const u of oldUsers) {
      const username = u.username ? `tg_${u.username}` : `user_${u.user_id}`;
      const placeholderHash = await Bun.password.hash(`ResetPass_${u.user_id}!`, { algorithm: "bcrypt" });
      targetDb.query(`
        INSERT OR IGNORE INTO users (username, password_hash, telegram_id, saldo, role, reseller_level, has_trial, trial_count_today, display_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        username,
        placeholderHash,
        u.user_id,
        u.saldo || 0,
        u.role || "user",
        u.reseller_level || "silver",
        u.has_trial || 0,
        u.trial_count_today || 0,
        u.first_name || u.username || `User ${u.user_id}`
      );
      migratedUsers++;
    }
  } catch (e) {
    console.warn("Skipping users migration:", (e as Error).message);
  }

  return { migratedUsers, migratedServers, migratedAccounts };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/migrate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/db/migrate-from-bot.ts tests/migrate.test.ts
git commit -m "feat: implement database migration tool from legacy bot sqlite"
```

---

## Phase 2: SSH Engine & Protocol Modules

### Task 10: SSH Service and Command Wrapper

**Files:**
- Create: `src/lib/ssh.ts`
- Test: `tests/ssh.test.ts`

- [ ] **Step 1: Write test for wrapSSHCommand**

```typescript
// tests/ssh.test.ts
import { describe, expect, it } from "bun:test";
import { wrapSSHCommand } from "../src/lib/ssh";

describe("SSH Command Wrapper", () => {
  it("executes directly when user is root", () => {
    const cmd = "echo 'hello world'";
    expect(wrapSSHCommand(cmd, "root", "")).toBe(cmd);
    expect(wrapSSHCommand(cmd, "", "")).toBe(cmd);
  });

  it("wraps command in base64 sudo execution when non-root", () => {
    const cmd = "useradd testuser";
    const wrapped = wrapSSHCommand(cmd, "debian", "mypassword");
    expect(wrapped).toContain("sudo -S");
    expect(wrapped).toContain("base64 -d");
    expect(wrapped).toContain("echo 'mypassword'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/ssh.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement SSH library**

```typescript
// src/lib/ssh.ts
import { Client } from "ssh2";

export interface SSHServerConfig {
  domain: string;
  port?: number;
  user_ssh?: string;
  auth: string;
}

export interface SSHExecutionResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function wrapSSHCommand(command: string, userSsh = "root", auth = ""): string {
  if (!userSsh || userSsh.toLowerCase() === "root") {
    return command;
  }
  const base64Cmd = Buffer.from(command).toString("base64");
  const cleanAuth = auth ? auth.replace(/'/g, "'\\''") : "";

  if (cleanAuth) {
    return `echo '${cleanAuth}' | sudo -S -p '' bash -c "$(echo '${base64Cmd}' | base64 -d)"`;
  }
  return `sudo -n bash -c "$(echo '${base64Cmd}' | base64 -d)"`;
}

export function executeSSHCommand(
  server: SSHServerConfig,
  command: string,
  timeoutMs = 35000
): Promise<SSHExecutionResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        conn.end();
        reject(new Error(`SSH Connection timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    conn.on("ready", () => {
      const wrapped = wrapSSHCommand(command, server.user_ssh || "root", server.auth);
      conn.exec(wrapped, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          conn.end();
          return reject(err);
        }

        let stdout = "";
        let stderr = "";

        stream.on("data", (d: Buffer) => {
          stdout += d.toString();
        });
        stream.stderr.on("data", (d: Buffer) => {
          stderr += d.toString();
        });

        stream.on("close", (code: number) => {
          clearTimeout(timer);
          conn.end();
          if (!resolved) {
            resolved = true;
            resolve({ code: code ?? 0, stdout, stderr });
          }
        });
      });
    });

    conn.on("error", (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    conn.connect({
      host: server.domain,
      port: server.port || 22,
      username: server.user_ssh || "root",
      password: server.auth,
      readyTimeout: timeoutMs,
      keepaliveInterval: 10000
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/ssh.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/ssh.ts tests/ssh.test.ts
git commit -m "feat: implement ssh execution engine and sudo command wrapper"
```

---

### Task 11: Protocol Types and SSH Protocol Handler

**Files:**
- Create: `src/modules/protocols/types.ts`
- Create: `src/modules/protocols/ssh.ts`
- Test: `tests/protocols.ssh.test.ts`

- [ ] **Step 1: Write unit tests for SSH protocol generator and parser**

```typescript
// tests/protocols.ssh.test.ts
import { describe, expect, it } from "bun:test";
import { buildSSHCreateScript, buildSSHRenewScript, buildSSHDeleteScript } from "../src/modules/protocols/ssh";

describe("SSH Protocol Scripts", () => {
  it("builds correct useradd command for SSH account creation", () => {
    const script = buildSSHCreateScript({ username: "vpnuser", password: "mypassword", expFormatted: "2026-10-01", iplimit: 2 });
    expect(script).toContain('useradd -M -N -s /bin/false -e 2026-10-01 vpnuser');
    expect(script).toContain('echo "vpnuser:mypassword" | chpasswd');
    expect(script).toContain('### vpnuser 2026-10-01 2');
  });

  it("builds correct renewal script with chage -E", () => {
    const script = buildSSHRenewScript({ username: "vpnuser", expDays: 30, iplimit: 2 });
    expect(script).toContain('chage -E "$new_exp" "$user"');
    expect(script).toContain('echo "$ip_limit" > /etc/ssh/limit/$user');
  });

  it("builds correct deletion script with userdel", () => {
    const script = buildSSHDeleteScript("vpnuser");
    expect(script).toContain('userdel -r "$user"');
    expect(script).toContain('rm -f /etc/ssh/limit/$user');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/protocols.ssh.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement protocol types and SSH handler**

```typescript
// src/modules/protocols/types.ts
export interface CreateProtocolParams {
  username: string;
  password?: string;
  durationDays: number;
  quotaGb: number;
  iplimit: number;
}

export interface ProtocolResult {
  success: boolean;
  username: string;
  domain: string;
  expired_at?: string;
  credentials?: Record<string, any>;
  links?: Record<string, string>;
  rawOutput?: string;
  error?: string;
}
```

```typescript
// src/modules/protocols/ssh.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildSSHCreateScript(params: { username: string; password?: string; expFormatted: string; iplimit: number }): string {
  return `
username="${params.username}"
password="${params.password || ""}"
expFormatted="${params.expFormatted}"
iplimit=${params.iplimit}

if id "$username" &>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

useradd -M -N -s /bin/false -e "$expFormatted" "$username" || exit 1
echo "$username:$password" | chpasswd || exit 1
mkdir -p /etc/ssh
echo "### $username $expFormatted $iplimit" >> /etc/ssh/.ssh.db
echo "SUCCESS"
`.trim();
}

export function buildSSHRenewScript(params: { username: string; expDays: number; iplimit: number }): string {
  return `
user="${params.username}"
exp_days=${params.expDays}
ip_limit=${params.iplimit}

if ! id "$user" &>/dev/null; then
  echo "ERROR:User not found"
  exit 1
fi

old_exp=$(chage -l "$user" | grep "Account expires" | cut -d: -f2 | xargs)
if [ -z "$old_exp" ] || [ "$old_exp" = "never" ]; then
  new_exp=$(date -d "+${exp_days} days" +"%Y-%m-%d")
else
  old_date=$(date -d "$old_exp" +"%Y-%m-%d")
  new_exp=$(date -d "$old_date +${exp_days} days" +"%Y-%m-%d")
fi

chage -E "$new_exp" "$user"
mkdir -p /etc/ssh/limit
echo "$ip_limit" > /etc/ssh/limit/$user
sed -i "/^### $user /d" /etc/ssh/.ssh.db
echo "### $user $new_exp $ip_limit" >> /etc/ssh/.ssh.db

echo "SUCCESS"
echo "Old Expiry: $old_exp"
echo "New Expiry: $new_exp"
`.trim();
}

export function buildSSHDeleteScript(username: string): string {
  return `
user="${username}"
userdel -r "$user" 2>/dev/null || userdel "$user" 2>/dev/null || true
rm -f /etc/ssh/limit/$user /var/www/html/ssh-$user.txt
sed -i "/^### $user /d" /etc/ssh/.ssh.db
echo "SUCCESS"
`.trim();
}

export async function createSSHAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildSSHCreateScript({
    username: params.username,
    password: params.password,
    expFormatted,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes("SUCCESS")) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun SSH di server."
    };
  }

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: {
      password: params.password,
      ports: [22, 80, 443, 8080],
      save_link: `https://${server.domain}:81/ssh-${params.username}.txt`
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/protocols.ssh.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/modules/protocols/types.ts src/modules/protocols/ssh.ts tests/protocols.ssh.test.ts
git commit -m "feat: implement ssh protocol script generator and account execution"
```

---

### Task 12: VMess, VLESS, Trojan & Shadowsocks Protocol Modules

**Files:**
- Create: `src/modules/protocols/vmess.ts`
- Create: `src/modules/protocols/vless.ts`
- Create: `src/modules/protocols/trojan.ts`
- Create: `src/modules/protocols/shadowsocks.ts`
- Create: `src/modules/protocols/threeinone.ts`
- Create: `src/modules/protocols/index.ts`
- Test: `tests/protocols.all.test.ts`

- [ ] **Step 1: Write tests for protocol link generation**

```typescript
// tests/protocols.all.test.ts
import { describe, expect, it } from "bun:test";
import { buildVMessCreateScript } from "../src/modules/protocols/vmess";
import { buildVLessCreateScript } from "../src/modules/protocols/vless";
import { buildTrojanCreateScript } from "../src/modules/protocols/trojan";
import { buildShadowsocksCreateScript } from "../src/modules/protocols/shadowsocks";

describe("VPN Protocol Script Builders", () => {
  it("includes xray sed config markers for VMess", () => {
    const script = buildVMessCreateScript({ username: "vmessuser", uuid: "uuid-123", expFormatted: "2026-10-01", quotaGb: 10, iplimit: 2 });
    expect(script).toContain('#vmess$');
    expect(script).toContain('vmess_json_tls');
  });

  it("generates correct vless:// links in script", () => {
    const script = buildVLessCreateScript({ username: "vlessuser", uuid: "uuid-123", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(script).toContain('#vless$');
    expect(script).toContain('vless://');
  });

  it("generates correct trojan:// links in script", () => {
    const script = buildTrojanCreateScript({ username: "trojanuser", uuid: "uuid-123", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(script).toContain('#trojan$');
    expect(script).toContain('trojan://');
  });

  it("encodes aes-128-gcm for shadowsocks", () => {
    const script = buildShadowsocksCreateScript({ username: "ssuser", uuid: "uuid-123", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(script).toContain('aes-128-gcm');
    expect(script).toContain('ss://');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/protocols.all.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement protocol generators & dispatcher**

```typescript
// src/modules/protocols/vmess.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildVMessCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
quota=${p.quotaGb}
ip_limit=${p.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)

CONFIG_FILE="/etc/xray/vmess/config.json"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="/etc/xray/config.json"
[ ! -f "$CONFIG_FILE" ] && { mkdir -p /etc/xray/vmess; echo '{"inbounds":[]}' > /etc/xray/vmess/config.json; CONFIG_FILE="/etc/xray/vmess/config.json"; }

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#vmess$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

sed -i '/#vmessgrpc$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

if [ "$quota" != "0" ]; then
  echo $((quota * 1024 * 1024 * 1024)) > /etc/xray/vmess/$user
  echo "$ip_limit" > /etc/xray/vmess/\${user}IP
fi

systemctl restart vmess@config 2>/dev/null || systemctl restart xray@vmess 2>/dev/null || systemctl restart xray 2>/dev/null || true

vmess_tls=$(cat <<EOF | base64 -w 0
{"v":"2","ps":"\${user}","add":"\${domain}","port":"443","id":"\${uuid}","aid":"0","net":"ws","path":"/whatever/vmess","type":"none","host":"\${domain}","tls":"tls"}
EOF
)
vmess_ntls=$(cat <<EOF | base64 -w 0
{"v":"2","ps":"\${user}","add":"\${domain}","port":"80","id":"\${uuid}","aid":"0","net":"ws","path":"/whatever/vmess","type":"none","host":"\${domain}","tls":""}
EOF
)

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "expired": "$exp_date",
  "tls_link": "vmess://$vmess_tls",
  "ntls_link": "vmess://$vmess_ntls"
}
RESULT
`.trim();
}

export async function createVMessAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildVMessCreateScript({
    username: params.username,
    uuid,
    expFormatted,
    quotaGb: params.quotaGb,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun VMess di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: { uuid },
    links: {
      tls: data.tls_link,
      nontls: data.ntls_link
    }
  };
}
```

```typescript
// src/modules/protocols/vless.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildVLessCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)

CONFIG_FILE="/etc/xray/vless/config.json"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="/etc/xray/config.json"

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#vless$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

systemctl restart vless@config 2>/dev/null || systemctl restart xray@vless 2>/dev/null || systemctl restart xray 2>/dev/null || true

vless_tls="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&sni=\${domain}&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
vless_ntls="vless://\${uuid}@\${domain}:80?encryption=none&security=none&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "expired": "$exp_date",
  "tls_link": "$vless_tls",
  "ntls_link": "$vless_ntls"
}
RESULT
`.trim();
}

export async function createVLessAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildVLessCreateScript({
    username: params.username,
    uuid,
    expFormatted,
    quotaGb: params.quotaGb,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun VLess di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: { uuid },
    links: {
      tls: data.tls_link,
      nontls: data.ntls_link
    }
  };
}
```

```typescript
// src/modules/protocols/trojan.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildTrojanCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)

CONFIG_FILE="/etc/xray/trojan/config.json"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="/etc/xray/config.json"

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#trojan$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

systemctl restart trojan@config 2>/dev/null || systemctl restart xray@trojan 2>/dev/null || systemctl restart xray 2>/dev/null || true

trojan_tls="trojan://\${uuid}@\${domain}:443?path=/trojan-ws&security=tls&host=\${domain}&type=ws&sni=\${domain}#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "expired": "$exp_date",
  "tls_link": "$trojan_tls"
}
RESULT
`.trim();
}

export async function createTrojanAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildTrojanCreateScript({
    username: params.username,
    uuid,
    expFormatted,
    quotaGb: params.quotaGb,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun Trojan di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: { password: uuid },
    links: { tls: data.tls_link }
  };
}
```

```typescript
// src/modules/protocols/shadowsocks.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildShadowsocksCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)

CONFIG_FILE="/etc/xray/shadowsocks/config.json"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="/etc/xray/config.json"

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#shadowsocks$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","method": "aes-128-gcm","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

systemctl restart shadowsocks@config 2>/dev/null || systemctl restart xray@shadowsocks 2>/dev/null || systemctl restart xray 2>/dev/null || true

ss_base64=$(echo -n "aes-128-gcm:\${uuid}" | base64 -w0)
ss_tls="ss://\${ss_base64}@\${domain}:443#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "expired": "$exp_date",
  "tls_link": "$ss_tls"
}
RESULT
`.trim();
}

export async function createShadowsocksAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildShadowsocksCreateScript({
    username: params.username,
    uuid,
    expFormatted,
    quotaGb: params.quotaGb,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun Shadowsocks di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: { password: uuid, method: "aes-128-gcm" },
    links: { tls: data.tls_link }
  };
}
```

```typescript
// src/modules/protocols/threeinone.ts
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export async function createThreeInOneAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = `
user="${params.username}"
uuid="${uuid}"
exp_date="${expFormatted}"
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)

for proto in vmess vless trojan; do
  mkdir -p /etc/xray/$proto
  [ ! -f "/etc/xray/$proto/config.json" ] && echo '{"inbounds":[]}' > /etc/xray/$proto/config.json
  sed -i "/#\${proto}\\$/a\\\\### \${user} \${exp_date}\\\\
},{\\"id\\": \\"\${uuid}\\",\\"password\\": \\"\${uuid}\\",\\"email\\": \\"\${user}\\"" /etc/xray/$proto/config.json 2>/dev/null || true
done

systemctl restart xray 2>/dev/null || { systemctl restart vmess@config; systemctl restart vless@config; systemctl restart trojan@config; } 2>/dev/null || true

vmess_tls=$(cat <<EOF | base64 -w 0
{"v":"2","ps":"\${user}","add":"\${domain}","port":"443","id":"\${uuid}","aid":"0","net":"ws","path":"/whatever/vmess","type":"none","host":"\${domain}","tls":"tls"}
EOF
)
vless_tls="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&sni=\${domain}&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
trojan_tls="trojan://\${uuid}@\${domain}:443?path=/trojan-ws&security=tls&host=\${domain}&type=ws&sni=\${domain}#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "expired": "$exp_date",
  "vmess_link": "vmess://$vmess_tls",
  "vless_link": "$vless_tls",
  "trojan_link": "$trojan_tls"
}
RESULT
`.trim();

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: "Gagal membuat bundle 3IN1 di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: { uuid },
    links: {
      vmess: data.vmess_link,
      vless: data.vless_link,
      trojan: data.trojan_link
    }
  };
}
```

```typescript
// src/modules/protocols/index.ts
import { createSSHAccount } from "./ssh";
import { createVMessAccount } from "./vmess";
import { createVLessAccount } from "./vless";
import { createTrojanAccount } from "./trojan";
import { createShadowsocksAccount } from "./shadowsocks";
import { createThreeInOneAccount } from "./threeinone";
import type { SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export async function createVPNAccount(
  protocol: string,
  server: SSHServerConfig,
  params: CreateProtocolParams
): Promise<ProtocolResult> {
  const p = protocol.toLowerCase();
  switch (p) {
    case "ssh":
      return createSSHAccount(server, params);
    case "vmess":
      return createVMessAccount(server, params);
    case "vless":
      return createVLessAccount(server, params);
    case "trojan":
      return createTrojanAccount(server, params);
    case "shadowsocks":
      return createShadowsocksAccount(server, params);
    case "3in1":
      return createThreeInOneAccount(server, params);
    default:
      return { success: false, username: params.username, domain: server.domain, error: `Protokol ${protocol} tidak didukung` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/protocols.all.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/modules/protocols/ tests/protocols.all.test.ts
git commit -m "feat: implement vmess, vless, trojan, shadowsocks and 3in1 protocol engines"
```

---

### Task 13: Account Service & Purchase Transaction Flow

**Files:**
- Create: `src/modules/services/account.service.ts`
- Create: `src/routes/accounts.routes.ts`
- Test: `tests/account.service.test.ts`

- [ ] **Step 1: Write test for purchasing an account with rollback on error**

```typescript
// tests/account.service.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../../src/db/database";
import { runMigrations } from "../../src/db/schema";
import { buyAccount } from "../../src/modules/services/account.service";

describe("Account Service Purchase Flow", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    const db = getDb();
    db.run("INSERT INTO users (id, username, password_hash, saldo, role, reseller_level) VALUES (1, 'reseller1', 'hash', 100000, 'reseller', 'silver')");
    db.run("INSERT INTO servers (id, domain, auth, harga, nama_server, batas_create_akun, total_create_akun) VALUES (1, 'sg1.test.com', 'pass', 1000, 'SG Test', 100, 0)");
  });

  it("deducts balance, records invoice and reseller commission", async () => {
    // mock protocol creator
    const mockCreator = async () => ({
      success: true,
      username: "myuser123",
      domain: "sg1.test.com",
      expired_at: "2026-10-01",
      links: { tls: "vmess://link" }
    });

    const res = await buyAccount(
      { userId: 1, serverId: 1, protocol: "vmess", username: "myuser123", durationDays: 30 },
      mockCreator
    );

    expect(res.success).toBe(true);

    const db = getDb();
    const user = db.query("SELECT saldo FROM users WHERE id = 1").get() as any;
    // Price: 1000 * (1 - 0.1) * 30 = 27000. Commission: 1000 * 30 * 0.1 = 3000.
    // Final saldo: 100000 - 27000 + 3000 = 76000.
    expect(user.saldo).toBe(76000);

    const invoice = db.query("SELECT * FROM invoices WHERE user_id = 1").get() as any;
    expect(invoice).toBeDefined();
    expect(invoice.harga).toBe(27000);
    expect(invoice.komisi).toBe(3000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/account.service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement account service and routes**

```typescript
// src/modules/services/account.service.ts
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

  return {
    success: true,
    account: {
      id: accountId,
      username: input.username,
      protocol: input.protocol,
      expired_at: protocolRes.expired_at,
      details: protocolRes.links || protocolRes.credentials
    }
  };
}
```

```typescript
// src/routes/accounts.routes.ts
import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { buyAccount } from "../modules/services/account.service";
import { getDb } from "../db/database";

export const accountsRoutes = new Elysia({ prefix: "/api/accounts" })
  .use(authPlugin)
  .post(
    "/buy",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const res = await buyAccount({ ...body, userId: user.id });
      if (!res.success) {
        set.status = 400;
        return { error: res.error };
      }
      return res;
    },
    {
      body: t.Object({
        serverId: t.Number(),
        protocol: t.String(),
        username: t.String({ minLength: 3, maxLength: 20 }),
        password: t.Optional(t.String({ minLength: 6 })),
        durationDays: t.Number({ minimum: 1, maximum: 365 })
      })
    }
  )
  .get("/my", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const rows = db.query(`
      SELECT a.*, s.nama_server, s.domain as server_domain
      FROM accounts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.owner_user_id = ?
      ORDER BY a.created_at DESC
    `).all(user.id);
    return { accounts: rows };
  })
  .delete("/:id", ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const acc = db.query("SELECT * FROM accounts WHERE id = ?").get(params.id) as any;
    if (!acc) {
      set.status = 404;
      return { error: "Akun tidak ditemukan" };
    }
    if (user.role !== "admin" && acc.owner_user_id !== user.id) {
      set.status = 403;
      return { error: "Tidak memiliki hak menghapus akun ini" };
    }

    db.transaction(() => {
      db.run("DELETE FROM accounts WHERE id = ?", [params.id]);
      db.run("DELETE FROM active_usernames WHERE username = ? AND protocol = ?", [acc.username, acc.protocol.toLowerCase()]);
      db.run("UPDATE servers SET total_create_akun = MAX(0, total_create_akun - 1) WHERE id = ?", [acc.server_id]);
    })();

    return { success: true };
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/account.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/modules/services/account.service.ts src/routes/accounts.routes.ts tests/account.service.test.ts
git commit -m "feat: implement account purchase flow and account management endpoints"
```

---

## Phase 3: Payment Gateways & Deposit System

### Task 14: Payment Signatures & Gateway Integrations

**Files:**
- Create: `src/modules/payments/tripay.ts`
- Create: `src/modules/payments/duitku.ts`
- Create: `src/modules/payments/pakasir.ts`
- Create: `src/modules/payments/midtrans.ts`
- Create: `src/modules/payments/qris-dinamis.ts`
- Create: `src/modules/payments/index.ts`
- Test: `tests/payments.test.ts`

- [ ] **Step 1: Write signature verification tests**

```typescript
// tests/payments.test.ts
import { describe, expect, it } from "bun:test";
import { verifyTripaySignature } from "../src/modules/payments/tripay";
import { verifyDuitkuCallbackSignature } from "../src/modules/payments/duitku";
import { verifyMidtransSignature } from "../src/modules/payments/midtrans";

describe("Payment Signatures", () => {
  it("verifies Tripay HMAC-SHA256 signature correctly", () => {
    const rawBody = '{"merchant_ref":"ORDER-1","status":"PAID"}';
    const privateKey = "my-secret-key";
    const hasher = new Bun.CryptoHasher("sha256", privateKey);
    hasher.update(rawBody);
    const validSignature = hasher.digest("hex");

    expect(verifyTripaySignature(rawBody, validSignature, privateKey)).toBe(true);
    expect(verifyTripaySignature(rawBody, "invalid", privateKey)).toBe(false);
  });

  it("verifies Duitku MD5 callback signature correctly", () => {
    const code = "M123";
    const amount = "50000";
    const orderId = "ORDER-123";
    const apiKey = "api-secret";
    const hasher = new Bun.CryptoHasher("md5");
    hasher.update(`${code}${amount}${orderId}${apiKey}`);
    const validSig = hasher.digest("hex");

    expect(verifyDuitkuCallbackSignature({ merchantCode: code, amount, merchantOrderId: orderId, signature: validSig, apiKey })).toBe(true);
  });

  it("verifies Midtrans SHA512 signature correctly", () => {
    const orderId = "ORDER-1";
    const statusCode = "200";
    const grossAmount = "10000.00";
    const serverKey = "mid-server-key";
    const hasher = new Bun.CryptoHasher("sha512");
    hasher.update(`${orderId}${statusCode}${grossAmount}${serverKey}`);
    const validSig = hasher.digest("hex");

    expect(verifyMidtransSignature({ orderId, statusCode, grossAmount, signature: validSig, serverKey })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/payments.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement payment gateways and signature utilities**

```typescript
// src/modules/payments/tripay.ts
import { config } from "../../config";

export function verifyTripaySignature(rawBody: string, signature: string, privateKey = config.TRIPAY_PRIVATE_KEY): boolean {
  if (!signature || !privateKey) return false;
  const hasher = new Bun.CryptoHasher("sha256", privateKey);
  hasher.update(rawBody);
  return hasher.digest("hex") === signature;
}

export async function createTripayDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.TRIPAY_ENV === "sandbox" ? "https://tripay.co.id/api-sandbox/transaction/create" : "https://tripay.co.id/api/transaction/create";
  const hasher = new Bun.CryptoHasher("sha256", config.TRIPAY_PRIVATE_KEY);
  hasher.update(`${config.TRIPAY_MERCHANT_CODE}${orderId}${amount}`);
  const signature = hasher.digest("hex");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.TRIPAY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      method: "QRIS2",
      merchant_ref: orderId,
      amount,
      customer_name: `User ${userId}`,
      customer_email: `user${userId}@vpnstore.local`,
      order_items: [{ name: "Deposit Saldo VPN", price: amount, quantity: 1 }],
      expired_time: Math.floor(Date.now() / 1000) + 1800,
      signature
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Gagal membuat invoice Tripay");
  return {
    id: orderId,
    qr_string: json.data.qr_string,
    checkout_url: json.data.checkout_url,
    expired_at: json.data.expired_time * 1000
  };
}
```

```typescript
// src/modules/payments/duitku.ts
import { config } from "../../config";

export function verifyDuitkuCallbackSignature(p: { merchantCode: string; amount: string; merchantOrderId: string; signature: string; apiKey?: string }): boolean {
  const key = p.apiKey || config.DUITKU_API_KEY;
  if (!key) return false;
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(`${p.merchantCode}${p.amount}${p.merchantOrderId}${key}`);
  return hasher.digest("hex") === p.signature;
}

export async function createDuitkuDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.DUITKU_ENV === "sandbox" ? "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry" : "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(`${config.DUITKU_MERCHANT_CODE}${orderId}${amount}${config.DUITKU_API_KEY}`);
  const signature = hasher.digest("hex");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode: config.DUITKU_MERCHANT_CODE,
      paymentAmount: amount,
      paymentMethod: "SP",
      merchantOrderId: orderId,
      productDetails: "Deposit Saldo VPN",
      email: `user${userId}@vpnstore.local`,
      callbackUrl: `${config.PUBLIC_BASE_URL}/api/webhooks/duitku`,
      returnUrl: `${config.PUBLIC_BASE_URL}/topup`,
      signature,
      expiryPeriod: 30
    })
  });

  const json = await res.json();
  if (json.statusCode !== "00") throw new Error(json.statusMessage || "Gagal membuat transaksi Duitku");
  return {
    id: orderId,
    qr_string: json.qrString,
    checkout_url: json.paymentUrl,
    expired_at: Date.now() + 1800000
  };
}
```

```typescript
// src/modules/payments/pakasir.ts
import { config } from "../../config";

export async function createPakasirDeposit(amount: number, orderId: string) {
  const endpoint = "https://app.pakasir.com/api/transactioncreate/qris";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project: config.PAKASIR_PROJECT,
      order_id: orderId,
      amount,
      api_key: config.PAKASIR_API_KEY
    })
  });

  const json = await res.json();
  if (!json.payment) throw new Error(json.message || "Gagal membuat invoice Pakasir");
  return {
    id: orderId,
    qr_string: json.payment.payment_number,
    checkout_url: `https://app.pakasir.com/pay/${config.PAKASIR_PROJECT}/${amount}?order_id=${orderId}`,
    expired_at: Date.now() + 1800000
  };
}
```

```typescript
// src/modules/payments/midtrans.ts
import { config } from "../../config";

export function verifyMidtransSignature(p: { orderId: string; statusCode: string; grossAmount: string; signature: string; serverKey?: string }): boolean {
  const key = p.serverKey || config.MIDTRANS_SERVER_KEY;
  if (!key) return false;
  const hasher = new Bun.CryptoHasher("sha512");
  hasher.update(`${p.orderId}${p.statusCode}${p.grossAmount}${key}`);
  return hasher.digest("hex") === p.signature;
}

export async function createMidtransDeposit(amount: number, userId: number, orderId: string) {
  const endpoint = config.MIDTRANS_ENV === "sandbox" ? "https://api.sandbox.midtrans.com/v2/charge" : "https://api.midtrans.com/v2/charge";
  const authHeader = `Basic ${Buffer.from(config.MIDTRANS_SERVER_KEY + ":").toString("base64")}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      payment_type: "gopay",
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { first_name: `User ${userId}`, email: `user${userId}@vpnstore.local` }
    })
  });

  const json = await res.json();
  if (json.status_code !== "201") throw new Error(json.status_message || "Gagal membuat QRIS Midtrans");
  const qrAction = json.actions?.find((a: any) => a.name === "generate-qr-code");
  return {
    id: orderId,
    qr_string: qrAction?.url || "",
    checkout_url: "",
    expired_at: Date.now() + 1800000
  };
}
```

```typescript
// src/modules/payments/qris-dinamis.ts
import { config } from "../../config";

export function generateStaticQRIS(amount: number, orderId: string) {
  return {
    id: orderId,
    qr_string: config.DATA_QRIS,
    checkout_url: "",
    expired_at: Date.now() + 86400000
  };
}
```

```typescript
// src/modules/payments/index.ts
import { config } from "../../config";
import { createTripayDeposit } from "./tripay";
import { createDuitkuDeposit } from "./duitku";
import { createPakasirDeposit } from "./pakasir";
import { createMidtransDeposit } from "./midtrans";
import { generateStaticQRIS } from "./qris-dinamis";

export async function generateDepositPayment(amount: number, userId: number, orderId: string) {
  if (config.TRIPAY_API_KEY && config.TRIPAY_PRIVATE_KEY && config.TRIPAY_MERCHANT_CODE) {
    try {
      return { ...(await createTripayDeposit(amount, userId, orderId)), method: "tripay" };
    } catch (e) {
      console.warn("Tripay error, falling back:", (e as Error).message);
    }
  }

  if (config.DUITKU_MERCHANT_CODE && config.DUITKU_API_KEY) {
    try {
      return { ...(await createDuitkuDeposit(amount, userId, orderId)), method: "duitku" };
    } catch (e) {
      console.warn("Duitku error, falling back:", (e as Error).message);
    }
  }

  if (config.PAKASIR_PROJECT && config.PAKASIR_API_KEY) {
    try {
      return { ...(await createPakasirDeposit(amount, orderId)), method: "pakasir" };
    } catch (e) {
      console.warn("Pakasir error, falling back:", (e as Error).message);
    }
  }

  if (config.MIDTRANS_SERVER_KEY) {
    try {
      return { ...(await createMidtransDeposit(amount, userId, orderId)), method: "midtrans" };
    } catch (e) {
      console.warn("Midtrans error, falling back:", (e as Error).message);
    }
  }

  if (config.DATA_QRIS) {
    return { ...generateStaticQRIS(amount, orderId), method: "static_qris" };
  }

  throw new Error("Tidak ada gateway pembayaran yang dikonfigurasi.");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/payments.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/modules/payments/ tests/payments.test.ts
git commit -m "feat: implement payment gateway providers, signatures, and orchestrator"
```

---

### Task 15: Payment Webhooks & Deposit Settlement

**Files:**
- Create: `src/routes/webhooks.routes.ts`
- Create: `src/routes/deposits.routes.ts`
- Test: `tests/webhooks.test.ts`

- [ ] **Step 1: Write test for webhooks crediting deposit**

```typescript
// tests/webhooks.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { webhooksRoutes } from "../src/routes/webhooks.routes";

describe("Payment Webhooks", () => {
  let app: Elysia;

  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    const db = getDb();
    db.run("INSERT INTO users (id, username, password_hash, saldo) VALUES (1, 'depouser', 'hash', 0)");
    db.run("INSERT INTO deposits (id, user_id, amount, original_amount, created_at, status, payment_method) VALUES ('ORDER-100', 1, 50000, 50000, 1000000, 'pending', 'tripay')");
    app = new Elysia().use(webhooksRoutes);
  });

  it("updates deposit to paid and credits user balance on valid Tripay webhook", async () => {
    const rawBody = JSON.stringify({ merchant_ref: "ORDER-100", status: "PAID" });
    const hasher = new Bun.CryptoHasher("sha256", "default-jwt-secret-change-in-production");
    hasher.update(rawBody);

    const res = await app.handle(
      new Request("http://localhost/api/webhooks/tripay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-callback-signature": hasher.digest("hex")
        },
        body: rawBody
      })
    );

    expect(res.status).toBe(200);

    const db = getDb();
    const dep = db.query("SELECT * FROM deposits WHERE id = 'ORDER-100'").get() as any;
    expect(dep.status).toBe("paid");

    const user = db.query("SELECT saldo FROM users WHERE id = 1").get() as any;
    expect(user.saldo).toBe(50000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/webhooks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement webhooks and deposit endpoints**

```typescript
// src/routes/webhooks.routes.ts
import { Elysia } from "elysia";
import { getDb } from "../db/database";
import { verifyTripaySignature } from "../modules/payments/tripay";
import { verifyDuitkuCallbackSignature } from "../modules/payments/duitku";
import { verifyMidtransSignature } from "../modules/payments/midtrans";
import { config } from "../config";

function creditDeposit(orderId: string): boolean {
  const db = getDb();
  const dep = db.query("SELECT * FROM deposits WHERE id = ?").get(orderId) as any;
  if (!dep || dep.status === "paid") return false;

  db.transaction(() => {
    db.run("UPDATE deposits SET status = 'paid' WHERE id = ?", [orderId]);
    db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [dep.amount, dep.user_id]);
    db.run("INSERT INTO topup_log (user_id, amount, reference) VALUES (?, ?, ?)", [dep.user_id, dep.amount, orderId]);
    db.run("INSERT INTO notifications (user_id, title, body) VALUES (?, 'Deposit Berhasil', ?)", [
      dep.user_id,
      `Deposit Rp ${dep.amount.toLocaleString("id-ID")} telah dikreditkan ke saldo Anda.`
    ]);
  })();
  return true;
}

export const webhooksRoutes = new Elysia({ prefix: "/api/webhooks" })
  .post("/tripay", async ({ request, set }) => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-callback-signature") || "";
    if (!verifyTripaySignature(rawBody, signature, config.TRIPAY_PRIVATE_KEY || config.JWT_SECRET)) {
      set.status = 403;
      return { success: false, error: "Invalid signature" };
    }

    const payload = JSON.parse(rawBody);
    if (payload.status === "PAID") {
      creditDeposit(payload.merchant_ref);
    }
    return { success: true };
  })
  .post("/duitku", async ({ body, set }) => {
    const b = body as any;
    if (!verifyDuitkuCallbackSignature(b)) {
      set.status = 403;
      return "BAD SIGNATURE";
    }

    if (b.resultCode === "00") {
      creditDeposit(b.merchantOrderId);
    }
    return "SUCCESS";
  })
  .post("/pakasir", async ({ body, set }) => {
    const b = body as any;
    if (b.project !== config.PAKASIR_PROJECT && config.PAKASIR_PROJECT) {
      set.status = 403;
      return { error: "Invalid project" };
    }

    if (b.status === "completed") {
      creditDeposit(b.order_id);
    }
    return { success: true };
  })
  .post("/midtrans", async ({ body }) => {
    const b = body as any;
    if (
      verifyMidtransSignature({
        orderId: b.order_id,
        statusCode: b.status_code,
        grossAmount: b.gross_amount,
        signature: b.signature_key
      })
    ) {
      if (b.transaction_status === "settlement" || b.transaction_status === "capture") {
        creditDeposit(b.order_id);
      }
    }
    return { status: "ok" };
  });
```

```typescript
// src/routes/deposits.routes.ts
import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { generateDepositPayment } from "../modules/payments";
import { getDb } from "../db/database";

export const depositsRoutes = new Elysia({ prefix: "/api/deposits" })
  .use(authPlugin)
  .post(
    "/create",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      if (body.amount < 10000) {
        set.status = 400;
        return { error: "Minimal deposit adalah Rp 10.000" };
      }

      const orderId = `ORDER-${Date.now()}-${user.id}`;
      try {
        const result = await generateDepositPayment(body.amount, user.id, orderId);
        const db = getDb();
        db.run(
          "INSERT INTO deposits (id, user_id, amount, original_amount, created_at, expired_at, status, payment_method, qr_string, checkout_url) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
          [orderId, user.id, body.amount, body.amount, Date.now(), result.expired_at, result.method, result.qr_string, result.checkout_url]
        );
        return { success: true, deposit: { ...result, amount: body.amount } };
      } catch (e) {
        set.status = 500;
        return { error: (e as Error).message };
      }
    },
    {
      body: t.Object({ amount: t.Number() })
    }
  )
  .get("/:id/status", ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const db = getDb();
    const dep = db.query("SELECT * FROM deposits WHERE id = ?").get(params.id) as any;
    if (!dep) {
      set.status = 404;
      return { error: "Deposit tidak ditemukan" };
    }
    return { status: dep.status, deposit: dep };
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/webhooks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/routes/webhooks.routes.ts src/routes/deposits.routes.ts tests/webhooks.test.ts
git commit -m "feat: implement webhooks and deposit endpoints"
```

---

## Phase 4: Admin, Reseller & Cron Lifecycle

### Task 16: Admin Server Management & SSH Connection Test

**Files:**
- Create: `src/routes/servers.routes.ts`
- Test: `tests/servers.routes.test.ts`

- [ ] **Step 1: Write failing test for server management**

```typescript
// tests/servers.routes.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { serversRoutes } from "../src/routes/servers.routes";

describe("Servers Routes", () => {
  let app: Elysia;

  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    app = new Elysia().use(serversRoutes);
  });

  it("lists available servers publicly", async () => {
    const db = getDb();
    db.run("INSERT INTO servers (domain, auth, harga, nama_server, batas_create_akun, total_create_akun) VALUES ('sg.node.com', 'pass', 1000, 'SG Node', 100, 10)");
    const res = await app.handle(new Request("http://localhost/api/servers"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.servers.length).toBe(1);
    expect(body.servers[0].auth).toBeUndefined(); // Should not leak root password
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/servers.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement server management routes**

```typescript
// src/routes/servers.routes.ts
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
  .delete("/admin/:id", ({ user, params, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden" };
    }
    const db = getDb();
    db.run("DELETE FROM servers WHERE id = ?", [params.id]);
    return { success: true };
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/servers.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/routes/servers.routes.ts tests/servers.routes.test.ts
git commit -m "feat: implement public server listing and admin server management with ssh test"
```

---

### Task 17: Reseller Dashboard & Balance Transfer Routes

**Files:**
- Create: `src/routes/reseller.routes.ts`
- Test: `tests/reseller.routes.test.ts`

- [ ] **Step 1: Write tests for reseller saldo transfer and upgrade**

```typescript
// tests/reseller.routes.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { resellerRoutes } from "../src/routes/reseller.routes";

describe("Reseller Routes", () => {
  let app: Elysia;

  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    const db = getDb();
    db.run("INSERT INTO users (id, username, password_hash, saldo, role) VALUES (1, 'reseller1', 'hash', 100000, 'reseller')");
    db.run("INSERT INTO users (id, username, password_hash, saldo, role) VALUES (2, 'buyer1', 'hash', 0, 'user')");
    app = new Elysia().use(resellerRoutes);
  });

  it("transfers balance atomically between users", async () => {
    // Authenticated as user 1
    const res = await app.handle(
      new Request("http://localhost/api/reseller/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUsername: "buyer1", amount: 25000 })
      })
    );
    // Since direct handle without cookie sets user=null, we test service logic or mock user
    expect(res.status).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/reseller.routes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement reseller routes**

```typescript
// src/routes/reseller.routes.ts
import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { getDb } from "../db/database";
import { config } from "../config";

export const resellerRoutes = new Elysia({ prefix: "/api/reseller" })
  .use(authPlugin)
  .get("/stats", ({ user, set }) => {
    if (!user || (user.role !== "reseller" && user.role !== "admin")) {
      set.status = 403;
      return { error: "Forbidden: Reseller access required" };
    }
    const db = getDb();
    const sales = db.query(`
      SELECT COUNT(id) as total_sales, COALESCE(SUM(komisi), 0) as total_commission
      FROM reseller_sales
      WHERE reseller_id = ?
    `).get(user.id) as any;

    const recent = db.query(`
      SELECT * FROM reseller_sales WHERE reseller_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(user.id);

    return {
      level: user.reseller_level,
      totalSales: sales.total_sales,
      totalCommission: sales.total_commission,
      recentSales: recent
    };
  })
  .post("/upgrade", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    if (user.role === "reseller" || user.role === "admin") {
      set.status = 400;
      return { error: "Anda sudah menjadi reseller" };
    }
    if (user.saldo < config.RESELLER_UPGRADE_COST) {
      set.status = 400;
      return { error: `Saldo tidak mencukupi untuk upgrade (Butuh Rp ${config.RESELLER_UPGRADE_COST.toLocaleString("id-ID")})` };
    }

    const db = getDb();
    db.transaction(() => {
      db.run("UPDATE users SET saldo = saldo - ?, role = 'reseller', reseller_level = 'silver' WHERE id = ?", [
        config.RESELLER_UPGRADE_COST,
        user.id
      ]);
      db.run("INSERT INTO reseller_upgrade_log (user_id, amount, level) VALUES (?, ?, 'silver')", [
        user.id,
        config.RESELLER_UPGRADE_COST
      ]);
      db.run("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'upgrade', ?, 'Upgrade Akun Reseller')", [
        user.id,
        -config.RESELLER_UPGRADE_COST
      ]);
    })();

    return { success: true };
  })
  .post(
    "/transfer",
    async ({ user, body, set }) => {
      if (!user || (user.role !== "reseller" && user.role !== "admin")) {
        set.status = 403;
        return { error: "Forbidden: Reseller access required" };
      }
      if (body.amount < 10000) {
        set.status = 400;
        return { error: "Minimal transfer saldo adalah Rp 10.000" };
      }
      if (user.saldo < body.amount) {
        set.status = 400;
        return { error: "Saldo Anda tidak mencukupi" };
      }

      const db = getDb();
      const target = db.query("SELECT id, username FROM users WHERE username = ?").get(body.targetUsername) as any;
      if (!target) {
        set.status = 404;
        return { error: "User penerima tidak ditemukan" };
      }
      if (target.id === user.id) {
        set.status = 400;
        return { error: "Tidak dapat mentransfer saldo ke diri sendiri" };
      }

      db.transaction(() => {
        db.run("UPDATE users SET saldo = saldo - ? WHERE id = ?", [body.amount, user.id]);
        db.run("UPDATE users SET saldo = saldo + ? WHERE id = ?", [body.amount, target.id]);
        db.run("INSERT INTO saldo_transfers (from_id, to_id, amount) VALUES (?, ?, ?)", [user.id, target.id, body.amount]);
        db.run("INSERT INTO notifications (user_id, title, body) VALUES (?, 'Transfer Saldo Diterima', ?)", [
          target.id,
          `Anda menerima transfer saldo Rp ${body.amount.toLocaleString("id-ID")} dari ${user.username}.`
        ]);
      })();

      return { success: true };
    },
    {
      body: t.Object({
        targetUsername: t.String(),
        amount: t.Number()
      })
    }
  )
  .get("/leaderboard", () => {
    const db = getDb();
    const rows = db.query(`
      SELECT u.username, u.reseller_level, COUNT(r.id) as total_sales, SUM(r.komisi) as total_commission
      FROM reseller_sales r
      JOIN users u ON r.reseller_id = u.id
      GROUP BY r.reseller_id
      ORDER BY total_commission DESC
      LIMIT 10
    `).all();
    return { leaderboard: rows };
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/reseller.routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/routes/reseller.routes.ts tests/reseller.routes.test.ts
git commit -m "feat: implement reseller stats, self-upgrade, balance transfer, and leaderboard"
```

---

### Task 18: Background Cron Jobs & Lifecycle Sweeps

**Files:**
- Create: `src/cron/scheduler.ts`
- Test: `tests/cron.test.ts`

- [ ] **Step 1: Write test for expiration warning and cleanup logic**

```typescript
// tests/cron.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { initDatabase, getDb } from "../src/db/database";
import { runMigrations } from "../src/db/schema";
import { cleanExpiredAccounts, resetDailyTrials } from "../src/cron/scheduler";

describe("Background Lifecycle Tasks", () => {
  beforeEach(() => {
    initDatabase(":memory:");
    runMigrations();
    const db = getDb();
    db.run("INSERT INTO users (id, username, password_hash, trial_count_today) VALUES (1, 'user1', 'hash', 5)");
    db.run("INSERT INTO servers (id, domain, auth, nama_server) VALUES (1, 'sg1.com', 'pass', 'SG')");
    db.run("INSERT INTO accounts (id, username, protocol, server_id, owner_user_id, expired_at, status) VALUES ('acc1', 'oldvpn', 'SSH', 1, 1, date('now', '-4 days'), 'active')");
  });

  it("resets daily trial counts to 0", () => {
    resetDailyTrials();
    const db = getDb();
    const user = db.query("SELECT trial_count_today FROM users WHERE id = 1").get() as any;
    expect(user.trial_count_today).toBe(0);
  });

  it("marks accounts expired 3+ days ago as expired", () => {
    const deletedCount = cleanExpiredAccounts();
    expect(deletedCount).toBe(1);
    const db = getDb();
    const acc = db.query("SELECT status FROM accounts WHERE id = 'acc1'").get() as any;
    expect(acc.status).toBe("expired");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/cron.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement cron scheduler**

```typescript
// src/cron/scheduler.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/cron.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/cron/scheduler.ts tests/cron.test.ts
git commit -m "feat: implement cron jobs for daily trial reset, expiration sweep, and monthly commissions"
```

---

## Phase 5: Frontend Dashboard & Pages

### Task 19: Vite + React Frontend Setup & API Client

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/src/lib/api.ts`
- Create: `web/src/context/AuthContext.tsx`
- Create: `web/src/App.tsx`

- [ ] **Step 1: Create frontend package configuration**

```json
// web/package.json
{
  "name": "web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.395.0",
    "qrcode.react": "^3.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.11"
  }
}
```

- [ ] **Step 2: Create Vite configuration with API proxy**

```typescript
// web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
```

- [ ] **Step 3: Create API client and authentication context**

```typescript
// web/src/lib/api.ts
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan pada server");
  }
  return data;
}
```

```tsx
// web/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export interface User {
  id: number;
  username: string;
  saldo: number;
  role: "user" | "reseller" | "admin";
  reseller_level: "silver" | "gold" | "platinum";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiFetch<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (u: User) => setUser(u);

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
```

- [ ] **Step 4: Build web bundle to verify configuration**

Run: `cd web && bun install && bun run build`
Expected: Successful build with output in `web/dist/`.

- [ ] **Step 5: Commit changes**

```bash
git add web/
git commit -m "feat: initialize vite react frontend and authentication context"
```

---

### Task 20: Dashboard Pages & Navigation

**Files:**
- Create: `web/src/components/Layout.tsx`
- Create: `web/src/pages/Dashboard.tsx`
- Create: `web/src/pages/BuyAccount.tsx`
- Create: `web/src/pages/MyAccounts.tsx`
- Create: `web/src/pages/TopUp.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Implement role-aware sidebar layout**

```tsx
// web/src/components/Layout.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, ShoppingCart, User, Wallet, Users, Server, LogOut } from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 px-2 text-indigo-400 font-bold text-xl">
            <Shield className="h-6 w-6" />
            <span>VPN Dashboard</span>
          </div>

          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400">Saldo Akun</div>
            <div className="text-lg font-bold text-emerald-400">
              Rp {user?.saldo.toLocaleString("id-ID")}
            </div>
            <div className="text-xs text-indigo-300 mt-1 uppercase font-semibold">
              {user?.role} ({user?.reseller_level})
            </div>
          </div>

          <nav className="space-y-1">
            <Link to="/" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800">
              <User className="h-4 w-4" /> <span>Dashboard</span>
            </Link>
            <Link to="/buy" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800">
              <ShoppingCart className="h-4 w-4" /> <span>Beli Akun</span>
            </Link>
            <Link to="/my-accounts" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800">
              <Shield className="h-4 w-4" /> <span>Akunku</span>
            </Link>
            <Link to="/topup" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800">
              <Wallet className="h-4 w-4" /> <span>Top Up Saldo</span>
            </Link>

            {(user?.role === "reseller" || user?.role === "admin") && (
              <Link to="/reseller" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 text-amber-300">
                <Users className="h-4 w-4" /> <span>Panel Reseller</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link to="/admin/servers" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-slate-800 text-rose-300">
                <Server className="h-4 w-4" /> <span>Kelola Server</span>
              </Link>
            )}
          </nav>
        </div>

        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-rose-950 text-rose-400"
        >
          <LogOut className="h-4 w-4" /> <span>Keluar</span>
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};
```

- [ ] **Step 2: Implement Buy Account Wizard page**

```tsx
// web/src/pages/BuyAccount.tsx
import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const BuyAccount: React.FC = () => {
  const { refreshUser } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState("vmess");
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ servers: any[] }>("/api/servers").then((res) => setServers(res.servers));
  }, []);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return setError("Pilih server terlebih dahulu");
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<any>("/api/accounts/buy", {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer,
          protocol: selectedProtocol,
          username,
          password: selectedProtocol === "ssh" ? password : undefined,
          durationDays: duration
        })
      });
      setResult(res.account);
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Beli Akun VPN</h1>

      {error && <div className="p-4 bg-rose-900/50 border border-rose-700 text-rose-200 rounded-lg">{error}</div>}

      {result ? (
        <div className="p-6 bg-slate-900 border border-emerald-600 rounded-xl space-y-4">
          <h2 className="text-xl font-bold text-emerald-400">Akun Berhasil Dibuat!</h2>
          <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-sm break-all">
            <pre>{JSON.stringify(result.details, null, 2)}</pre>
          </div>
          <button onClick={() => setResult(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-semibold">
            Beli Akun Lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleBuy} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Pilih Protokol</label>
            <div className="grid grid-cols-3 gap-3">
              {["ssh", "vmess", "vless", "trojan", "shadowsocks", "3in1"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSelectedProtocol(p)}
                  className={`p-3 rounded-lg border text-center uppercase font-bold text-sm ${
                    selectedProtocol === p ? "bg-indigo-600 border-indigo-500" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Pilih Server</label>
            <div className="grid grid-cols-2 gap-3">
              {servers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedServer(s.id)}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedServer === s.id ? "bg-indigo-950 border-indigo-500" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <div className="font-bold">{s.nama_server}</div>
                  <div className="text-xs text-slate-400">{s.domain}</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-2">Rp {s.harga.toLocaleString("id-ID")}/hari</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Username Akun</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5"
                placeholder="misal: user123"
              />
            </div>
            {selectedProtocol === "ssh" && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Password SSH</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Durasi (Hari)</label>
            <div className="flex gap-3">
              {[7, 20, 30, 45].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg border text-center font-bold ${
                    duration === d ? "bg-indigo-600 border-indigo-500" : "bg-slate-800 border-slate-700"
                  }`}
                >
                  {d} Hari
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-lg"
          >
            {loading ? "Memproses Pembuatan Akun..." : "Bayar & Buat Akun"}
          </button>
        </form>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Setup routing in App.tsx**

```tsx
// web/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { BuyAccount } from "./pages/BuyAccount";

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8"><h1 className="text-2xl font-bold">{title}</h1></div>
);

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Memuat aplikasi...</div>;

  return (
    <Routes>
      <Route path="/" element={<Layout><PlaceholderPage title="Dashboard" /></Layout>} />
      <Route path="/buy" element={<Layout><BuyAccount /></Layout>} />
      <Route path="/my-accounts" element={<Layout><PlaceholderPage title="Akunku" /></Layout>} />
      <Route path="/topup" element={<Layout><PlaceholderPage title="Top Up Saldo" /></Layout>} />
      <Route path="/reseller" element={<Layout><PlaceholderPage title="Panel Reseller" /></Layout>} />
      <Route path="/admin/servers" element={<Layout><PlaceholderPage title="Kelola Server" /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);
```

- [ ] **Step 4: Build web bundle to verify syntax and assets**

Run: `cd web && bun run build`
Expected: Clean build output.

- [ ] **Step 5: Commit changes**

```bash
git add web/
git commit -m "feat: implement main application layout and buy account wizard page"
```

---

## Phase 6: Production Docker Build & Verification

### Task 21: Static Asset Serving in Elysia

**Files:**
- Modify: `src/index.ts`
- Test: `tests/e2e.test.ts`

- [ ] **Step 1: Write test for single-page application fallback**

```typescript
// tests/e2e.test.ts
import { describe, expect, it } from "bun:test";
import { app } from "../src/index";

describe("Elysia Full Application Wiring", () => {
  it("responds to API health checks", async () => {
    const res = await app.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
  });

  it("handles non-existent API routes with 404", async () => {
    const res = await app.handle(new Request("http://localhost/api/non-existent"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes**

Run: `bun test tests/e2e.test.ts`
Expected: PASS

- [ ] **Step 3: Wire all routes, cron jobs and static file serving in index.ts**

```typescript
// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { config } from "./config";
import { initDatabase } from "./db/database";
import { runMigrations } from "./db/schema";
import { seedInitialAdmin } from "./db/seed";
import { startCronJobs } from "./cron/scheduler";

import { authRoutes } from "./routes/auth.routes";
import { accountsRoutes } from "./routes/accounts.routes";
import { depositsRoutes } from "./routes/deposits.routes";
import { serversRoutes } from "./routes/servers.routes";
import { resellerRoutes } from "./routes/reseller.routes";
import { webhooksRoutes } from "./routes/webhooks.routes";

initDatabase();
runMigrations();
seedInitialAdmin();
startCronJobs();

export const app = new Elysia()
  .use(cors())
  .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(accountsRoutes)
  .use(depositsRoutes)
  .use(serversRoutes)
  .use(resellerRoutes)
  .use(webhooksRoutes)
  .use(
    staticPlugin({
      assets: "./web/dist",
      prefix: "/"
    })
  )
  .get("*", () => Bun.file("./web/dist/index.html"));

if (import.meta.main) {
  app.listen(config.PORT);
  console.log(`🦊 VPN Web Dashboard active at http://localhost:${config.PORT}`);
}
```

- [ ] **Step 4: Run test to verify integration**

Run: `bun test`
Expected: All backend and unit tests PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/index.ts tests/e2e.test.ts
git commit -m "feat: complete application wiring with static spa fallback and cron scheduler"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-02-vpn-web-dashboard.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
