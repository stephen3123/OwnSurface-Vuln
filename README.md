# OwnSurface — Vulnerability Engine

**A production-grade website vulnerability and attack surface auditing platform.**

This is the **original "vulnerability tool" version** of OwnSurface (Git commit `c7dad86`), before the product pivoted to the "AI Co-founder" direction. It contains the full attack surface auditing engine, AI visibility checker, quick scan system, and a Next.js dashboard to visualize results.

---

## What It Does

| Feature | Description |
|---|---|
| **Attack Surface Audit** | Scans your verified domain for exposed subdomains, open ports, misconfigurations, and vulnerabilities. |
| **AI Visibility Check** | Checks whether your brand appears in AI-generated answers (LLM share-of-voice). |
| **Quick Scan** | Instant site health check via the homepage without logging in. |
| **X-Ray Scan** | Deep GitHub Action-based scan for production-breaking issues. |
| **Audit Reports** | PDF export of all scan results via `jspdf`. |

---

## Tech Stack

### Backend API (`apps/api`) — Rust
| Component | Technology |
|---|---|
| Language | Rust (Edition 2021) |
| Web Framework | Axum 0.8 |
| Database | PostgreSQL 15+ (via SQLx 0.8) |
| Cache | Dragonfly (Redis-compatible, via `redis` crate) |
| Message Queue | NATS (`async-nats 0.38`) |
| Auth | JWT (`jsonwebtoken 9`) + Argon2 password hashing |
| Runtime | Tokio (async) |

### Frontend Dashboard (`apps/dashboard`) — Next.js
| Component | Technology |
|---|---|
| Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Maps | react-simple-maps |
| State | Zustand + SWR |
| Payments | Stripe |
| Error Tracking | Sentry |

---

## Prerequisites

You need the following services running locally:

- **Rust** (stable, 1.75+) — `curl https://sh.rustup.rs | sh`
- **Node.js 20+** — `node --version`
- **PostgreSQL 15+** running on port `5433`
- **Dragonfly** (Redis-compatible cache) running on port `6380`
- **NATS server** running on port `4223`
- **Docker** (optional, but recommended for running Postgres/Dragonfly/NATS)

---

## Clone the Repository

```bash
git clone https://github.com/stephen3123/OwnSurface-Vuln.git
cd OwnSurface-Vuln
```

---

## Step 1: Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`. The key variables you must set for local dev:

```env
# Database (PostgreSQL running on port 5433)
DATABASE_URL=postgresql://xrayai:xrayai@localhost:5433/xrayai

# Cache (Dragonfly/Redis on port 6380)
DRAGONFLY_URL=redis://localhost:6380

# Message Queue (NATS on port 4223)
NATS_URL=nats://localhost:4223

# JWT secret — generate any long random string
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Claude API (for AI summary features)
CLAUDE_API_KEY=sk-ant-...

# API server settings
PORT=8080
RUST_LOG=info
RUST_ENV=development

# Dashboard URL (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Email (AWS SES / Brevo) and Stripe keys are **optional** for local development. The API will start without them in `development` mode.

---

## Step 2: Start Services with Docker (Recommended)

If you don't have Postgres/Dragonfly/NATS installed locally, the easiest way is Docker:

```bash
# PostgreSQL on port 5433
docker run -d --name pg -e POSTGRES_USER=xrayai -e POSTGRES_PASSWORD=xrayai -e POSTGRES_DB=xrayai -p 5433:5432 postgres:15

# Dragonfly (Redis-compatible) on port 6380
docker run -d --name dragonfly -p 6380:6379 docker.dragonflydb.io/dragonflydb/dragonfly

# NATS on port 4223
docker run -d --name nats -p 4223:4222 nats:latest
```

---

## Step 3: Run Database Migrations

The SQL migration files are in `infra/migrations/`. Run them in order against your PostgreSQL database:

```bash
# Using psql (adjust credentials as needed)
for f in infra/migrations/*.sql; do
  psql postgresql://xrayai:xrayai@localhost:5433/xrayai -f "$f"
done
```

---

## Step 4: Start the Rust API

```bash
cd apps/api
cargo run
```

The API will start on `http://localhost:8080`. You should see output like:
```
INFO  xrayai_api: Listening on 0.0.0.0:8080
```

---

## Step 5: Start the Next.js Dashboard

Open a **new terminal window**:

```bash
cd apps/dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

---

## How to Use (Step by Step)

### 1. Register an Account
- Visit `http://localhost:3000`
- Click **Sign Up** and create an account.
- A one-time OTP is sent via email (requires AWS SES or Brevo configured) or check the API logs in dev mode.

### 2. Verify a Domain
- Before scanning, you must **prove you own the domain**.
- Go to **Dashboard > Domains** and add your domain.
- The API will give you a DNS TXT record to add to your domain's DNS settings.
- Once the TXT record is live, click **Verify**.

### 3. Start an Attack Surface Audit
- Go to **Dashboard > Attack Surface**.
- Click **New Audit** and enter your verified domain.
- Choose a rate limit: `conservative`, `moderate`, or `aggressive`.
- The API publishes the audit request to NATS (`attacksurface.request`), and the worker picks it up.
- Poll `GET /attack-surface/{id}` for progress, or watch the dashboard update in real time.

### 4. AI Visibility Check
- Go to **Dashboard > AI Visibility**.
- Enter your domain and brand name.
- The engine checks whether your brand appears in AI-generated answers across LLMs.
- Results include **share of voice** and **citations**.

### 5. Quick Scan (No Login Required)
- From the homepage (`http://localhost:3000`), enter any URL in the Quick Scan bar.
- You get instant site health results (security headers, performance, SEO basics).

### 6. Export a Report
- From any audit result page, click **Export PDF**.
- The dashboard generates a PDF report using `jspdf` + `jspdf-autotable`.

---

## API Endpoints (Core)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/attack-surface` | Start an attack surface audit |
| `GET` | `/attack-surface` | List your audits |
| `GET` | `/attack-surface/{id}` | Get audit status and results |
| `POST` | `/attack-surface/{id}/cancel` | Cancel a running audit |
| `POST` | `/api/v1/ai-visibility` | Start an AI visibility check |
| `GET` | `/api/v1/ai-visibility` | List your AI visibility checks |
| `GET` | `/api/v1/ai-visibility/{id}` | Get detailed results + citations |

---

## Project Structure

```
OwnSurface-Vuln/
├── .env.example                 # Environment variable template
├── turbo.json                   # Turborepo config
├── package.json                 # Root workspace config
├── apps/
│   ├── api/                     # Rust backend (Axum + SQLx + NATS)
│   │   ├── Cargo.toml           # Rust dependencies
│   │   ├── src/
│   │   │   ├── main.rs          # Server entry point
│   │   │   ├── routes/
│   │   │   │   ├── attack_surface.rs   # Attack surface audit endpoints
│   │   │   │   ├── ai_visibility.rs    # AI brand visibility endpoints
│   │   │   │   ├── auth.rs             # Login/OTP/session
│   │   │   │   ├── billing.rs          # Stripe webhooks + subscription
│   │   │   │   └── bulk.rs             # Batch scan endpoints
│   │   │   ├── models/
│   │   │   │   ├── scan_result.rs      # Scan data model
│   │   │   │   ├── user.rs             # User + plan model
│   │   │   │   └── report.rs           # Report data model
│   │   │   └── middleware/
│   │   │       ├── auth.rs             # JWT auth middleware
│   │   │       ├── rate_limit.rs       # Rate limiter
│   │   │       └── security_headers.rs # Secure response headers
│   └── dashboard/               # Next.js 16 frontend
│       ├── app/                 # App Router pages
│       │   ├── page.tsx         # Homepage + Quick Scan
│       │   ├── dashboard/       # Authenticated dashboard
│       │   ├── report/          # Scan report view
│       │   └── pricing/         # Pricing page
│       └── components/          # Reusable React components
└── infra/
    └── migrations/              # PostgreSQL migration SQL files
```
