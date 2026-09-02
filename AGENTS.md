# VPN Web Dashboard

Standalone web dashboard for managing VPN accounts (SSH, VMess, VLESS, Trojan, Shadowsocks, 3IN1), deposits, reseller tiers, and automated cron sweeps.

## Tech Stack & Runtime

- **Runtime:** Bun (requires `bun:sqlite`, `Bun.password`, `Bun.CryptoHasher`, `bun:test`)
- **Backend:** ElysiaJS (`src/`)
- **Frontend:** React 18, Vite, Tailwind CSS (`web/`)
- **Database:** SQLite via native `bun:sqlite` (WAL mode, foreign keys enabled)
- **Deployment:** Multi-stage Docker (`Dockerfile`, `docker-compose.yml`)

## Essential Commands

### Backend & Verification
- Run all tests: `bun test`
- Run single test file: `bun test tests/<file>.test.ts`
- Run single test matching title: `bun test -t "creates deposit"`
- Start dev server (watch): `bun run dev` (runs `bun --watch src/index.ts`)
- Seed initial admin: `bun run src/db/seed.ts` (default: `admin` / `AdminPassword123!`, `needs_setup = 1`)

### Frontend
- Install frontend deps: `cd web && bun install`
- Start frontend dev: `cd web && bun run dev` (Vite dev server proxies `/api` -> `http://localhost:3000`)
- Typecheck & build frontend: `cd web && bun run build` (or root `bun run build:web`)

### Docker
- Build & run: `docker compose up --build`

## Key Architecture & Domain Rules

- **Database:** Native `bun:sqlite` without ORM. Migrations in `src/db/migrations.ts`. In tests, use `:memory:` and call `runMigrations(db)`. Preserve `PRAGMA foreign_keys = ON;` and WAL mode in production.
- **Admin Setup Lock:** Default admin account created with `needs_setup = 1`. Frontend redirects to `/setup` until credentials are changed via `POST /api/auth/setup-admin`.
- **SSH Command Execution:** Uses `ssh2`. Wrap scripts for non-root users via base64 sudo wrapper (`wrapSSHCommand` in `src/lib/ssh.ts`).
- **Pricing & Discounts:**
  - Admin accounts cost 0.
  - Reseller tier discounts: Silver (10%), Gold (20%), Platinum (30%).
  - 3IN1 bundle applies 1.5x multiplier to base server price.
  - Reseller commission is 10% on base server price.
  - Auto-upgrades tier based on accumulated commission (`>= 50,000` Gold, `>= 80,000` Platinum).
- **Payment Webhooks:** Raw body payloads are required for HMAC-SHA256 (Tripay), MD5 (Duitku), and SHA-512 (Midtrans) signature verification prior to updating deposit status to `paid`.
- **Static Assets in Production:** Elysia serves SPA bundle from `web/dist` with fallback route `Bun.file("./web/dist/index.html")`. Build `web/` before starting production backend.
- **Frontend UI & Copy Rules:**
  - Theme: Kawaii Pop (`Nunito` headings, `Inter` body, 3-4px solid black/white sticker borders, chunky offset box-shadows).
  - Dark mode: `darkMode: "class"`, persisted in `localStorage.getItem("theme")`.
  - Anti-slop: Strictly zero emojis and zero em dashes (`—`) in UI copy. Use professional Indonesian copy and Lucide icons.
