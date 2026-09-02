# VPN Web Dashboard

Standalone web dashboard for managing VPN accounts (SSH, VMess, VLESS, Trojan, Shadowsocks, 3IN1), deposits, reseller tiers, and automated cron sweeps.

## Tech Stack & Runtime

- **Runtime:** Bun (required for `bun:sqlite`, `Bun.password`, `Bun.CryptoHasher`, `bun:test`)
- **Backend:** ElysiaJS (`src/`)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (`web/`)
- **Database:** SQLite via native `bun:sqlite` (WAL mode, foreign keys enabled)
- **Deployment:** Multi-stage Docker (`Dockerfile`, `docker-compose.yml`)

## Structure

```
├── src/                # Backend source (Elysia API, DB, SSH, payment providers, cron)
│   ├── cron/           # Lifecycle sweeps (daily trials reset, account expiration, deposit sweep)
│   ├── db/             # SQLite connection, schema migrations, seeders
│   ├── lib/            # Auth JWT, SSH execution wrapper, pricing/commission logic
│   ├── modules/
│   │   ├── payments/   # Gateways (Tripay, Duitku, Pakasir, Midtrans, QRIS) & signatures
│   │   ├── protocols/  # VPN protocol script generators & executors
│   │   └── services/   # Account, deposit, reseller, expiration business logic
│   └── routes/         # Elysia route handlers (/api/auth, /api/accounts, /api/deposits, etc.)
├── tests/              # bun:test suites (unit, service, and route integration)
├── web/                # Vite + React SPA
└── plan.md             # Implementation reference plan
```

## Essential Commands

### Backend & Tests
- Run all tests: `bun test`
- Run single test: `bun test tests/<file>.test.ts`
- Start dev server (watch): `bun run dev` (or `bun run --watch src/index.ts`)
- Seed initial admin: `bun run src/db/seed.ts`

### Frontend
- Install frontend deps: `cd web && bun install`
- Start frontend dev: `cd web && bun run dev` (proxies `/api` -> `http://localhost:3000`)
- Build frontend: `cd web && bun run build` (or from root: `bun run build:web`)

### Docker
- Build & run: `docker compose up --build`

## Key Architecture & Domain Rules

- **Database:** Uses `bun:sqlite` directly without ORM. Tests should initialize `:memory:` and call `runMigrations()`. Always preserve WAL mode and `PRAGMA foreign_keys = ON;`.
- **SSH Command Execution:** Uses `ssh2`. When executing commands on target VPS nodes with non-root SSH user, wrap scripts with base64 sudo wrapper (`wrapSSHCommand`).
- **Pricing & Discounts:**
  - Admin accounts cost 0.
  - Reseller tier discounts: Silver (10%), Gold (20%), Platinum (30%).
  - 3IN1 bundle applies 1.5x multiplier to base server price.
  - Reseller commission is 10% on base server price.
  - Reseller tier auto-upgrades based on accumulated commission (>=50k Gold, >=80k Platinum).
- **Payment Webhooks:** Raw body payloads are required for HMAC-SHA256 (Tripay), MD5 (Duitku), and SHA-512 (Midtrans) signature verification prior to updating deposit status to `paid`.
- **Static Assets in Production:** Elysia serves SPA bundle from `web/dist` with fallback route `Bun.file("./web/dist/index.html")`. Build `web/` before running production server.
