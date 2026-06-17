# Priyadarshi Quant Lab

**Research. Backtest. Validate. Evolve.**

A personal hedge-fund-style quantitative strategy research platform — built MERN
(MongoDB, Express, React, Node) — for documenting, backtesting, scoring, and
comparing trading strategies end to end.

---

## What's included

**Backend (`/server`)**
- Express REST API with JWT access + refresh token authentication
- MongoDB/Mongoose schemas: `User`, `Strategy`, `Backtest`, `Indicator`,
  `CodeVersion`, `ResearchNote`, `Report`, `PerformanceMetric`, `Attachment`
- Full CRUD for strategies, backtests, research notes, Pine Script code
  versions, and indicators
- Strategy scorecard auto-grading (A+ to D) from weighted component scores
- Strategy comparison engine (win rate, profit factor, drawdown, Sharpe, expectancy)
- Dashboard analytics aggregation endpoint
- Cloudinary file uploads (equity curves, CSVs, PDFs) via Multer
- PDF report generation/download via PDFKit
- Helmet, CORS, rate limiting, centralized error handling

**Frontend (`/client`)**
- React 18 + Vite, Redux Toolkit (auth/UI state), React Query (server state)
- React Router with protected routes
- Dark "quant lab" design system: glassmorphism panels, electric-cyan accents,
  a mathematical grid background, and a canvas backdrop of the actual
  derivative formulas (velocity/acceleration/jerk, Market Reynolds Number)
  from your own research drifting behind the UI
- Pages: Landing, Login/Register, Dashboard, Strategies (list/detail/form),
  Backtests, Research Journal, Performance Analytics (correlation heatmap +
  comparison engine), Market Universe, Code Repository (Monaco editor + diff
  viewer), Reports, Settings
- Recharts equity curve / drawdown / radar charts, Monaco Editor for Pine Script

---

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `MONGO_URI` — create a free cluster at https://www.mongodb.com/cloud/atlas,
  then paste the connection string.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any long random strings.
- `CLOUDINARY_*` — create a free account at https://cloudinary.com if you want
  file/image uploads to work (equity curve screenshots, CSVs, PDFs). The app
  runs fine without this; only the Attachments upload endpoint needs it.

```bash
npm run dev
```

API runs on `http://localhost:5000`. Health check: `GET /api/health`.

Optional demo data:
```bash
npm run seed
```
This creates a demo user (`demo@priyadarshiquantlab.com` / `demoPassword123`)
with one example strategy and backtest so the dashboard isn't empty on first run.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm run dev
```

App runs on `http://localhost:5173` (proxies `/api` to the backend in dev).

### 3. First use

Visit `http://localhost:5173`, click **Get started** to register an account
(or sign in with the seeded demo account), then create your first strategy.

---

## Notes on scope

This is a complete, working full-stack scaffold covering every section from
the spec — strategy documentation, entry/exit rules, risk management,
trailing stops, indicators, Pine Script versioning with diff view, backtests
with TradingView-style metrics, scorecards, research journal, correlation
matrix, comparison engine, market universe, and PDF report generation.

A few pieces are intentionally left as extension points rather than fully
built out, since they depend on data you'll generate as you use the app:
- **Equity curve / Monte Carlo / walk-forward charts** render from data already
  modeled in the `Backtest` schema (`equityCurve`, `monteCarlo`, `walkForward`)
  but the UI for *uploading* that data (CSV/image) isn't wired up yet — for now,
  populate it via the API directly or extend the Backtest form.
- **DOCX report export** — PDF export works out of the box (PDFKit); DOCX can
  be added with a library like `docx` following the same pattern as
  `reportController.js`.
- **AI Research Assistant / Knowledge Graph / Strategy Evolution Tree** (listed
  as "bonus features" in the spec) are not built — they're substantial features
  in their own right and worth scoping separately once the core platform is in use.

Everything else is functional: auth, CRUD across all resources, the scorecard
grading logic, the comparison engine, the Pine Script diff viewer, and PDF
generation all work end to end once MongoDB is connected.
