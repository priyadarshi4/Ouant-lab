# Priyadarshi Quant Lab

**Research. Backtest. Validate. Evolve.**

A personal hedge-fund-style quantitative strategy research platform — built MERN
(MongoDB, Express, React, Node) — for documenting, backtesting, scoring, and
comparing trading strategies end to end.

---

## Phase 2: Institutional Research Terminal Upgrade

On top of the Phase 1 platform, this build adds:

- **LaTeX/KaTeX math rendering** — strategies now carry a `mathematicalFramework`
  array of formulas (label + LaTeX + note), rendered with KaTeX. The strategy
  editor has one-click templates for Kelly Criterion, Sharpe/Sortino/Calmar,
  RSI, ATR, Z-Score, and the velocity/acceleration/jerk/Reynolds-number
  formulas from your own ALMA/fluid-dynamics research.
- **Strategy Detail redesigned as a research paper** — cover image, Research
  Score + Quant Score dials, and all 18 spec sections (Executive Summary
  through Conclusion) as collapsible accordions, plus a Visual Analysis
  image gallery and a Version History timeline.
- **Strategy version control** — every edit snapshots the prior state; the
  Version History panel lets you roll back (which itself snapshots the
  pre-rollback state, so nothing is ever truly lost).
- **Research Score** — auto-computed (0–100) from documentation depth, math
  framework entries, code versions, backtests, and media — separate from the
  performance-based Quant Score, so a thin-but-lucky strategy doesn't look
  more "researched" than it is.
- **Backtest Detail page** — full TradingView-style Performance Summary and
  Trade Statistics grids (40+ fields: buy & hold return, max runup, Calmar,
  recovery factor, long/short win rates, consecutive win/loss streaks, etc.),
  Date Information panel, equity/drawdown charts, a monthly-return heatmap,
  yearly performance chart, rolling Sharpe/PF/drawdown chart, and a media
  gallery with fullscreen zoom.
- **Media galleries everywhere** — strategies and backtests both support
  categorized image/PDF/CSV uploads with a fullscreen lightbox (zoom, arrow
  key navigation).
- **Institutional comparison engine** — compare 2–10 strategies at once:
  switchable Performance/Risk/Return/Profitability radars, four scatter
  plots (risk vs return, PF vs drawdown, win rate vs expectancy, Sharpe vs
  Calmar), an equity curve overlay, and side-by-side research-dimension and
  performance-dimension tables.
- **Report Generator auto-fill** — an "Auto-Generate from Strategy Data"
  button drafts every report section from the strategy's actual stored
  documentation, latest backtest metrics, and research notes. If
  `ANTHROPIC_API_KEY` is set on the server, Claude polishes the draft into
  analyst prose (numbers are never invented — only the wording is improved);
  without a key, it still works using the deterministic template. Reports
  now export as PDF, DOCX, or standalone HTML.
- **Profile system** — avatar + banner upload, bio, education, skills,
  GitHub/LinkedIn/portfolio links, research interests, favorite markets,
  trading style, and experience level, all editable from Settings.
- **Knowledge Graph** — a force-directed graph (d3-force) connecting
  strategies, the indicators they use, the symbols they've been tested on,
  the market regimes they've seen, and their research notes. Click a
  strategy node to jump straight to its research record.
- **Ambient touches** — a decorative candlestick stream on the dashboard
  header and a code-activity timeline strip on the Code Repository page,
  alongside the floating-formula background from Phase 1.

### New environment variable

Add to `server/.env` if you want AI-polished report drafting (optional —
auto-generate works without it):
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## What's included

**Backend (`/server`)**
- Express REST API with JWT access + refresh token authentication
- MongoDB/Mongoose schemas: `User`, `Strategy`, `Backtest`, `Indicator`,
  `CodeVersion`, `ResearchNote`, `Report`, `PerformanceMetric`, `Attachment`,
  `StrategyVersionSnapshot`
- Full CRUD for strategies, backtests, research notes, Pine Script code
  versions, and indicators
- Strategy scorecard auto-grading (A+ to D) and Research Score auto-scoring
- Strategy comparison engine supporting up to 10 strategies
- Strategy version snapshots + rollback
- Dashboard analytics + knowledge-graph aggregation endpoints
- Cloudinary file uploads (equity curves, CSVs, PDFs, profile images) via Multer
- PDF (PDFKit), DOCX (`docx`), and HTML report export, plus data-grounded
  auto-generation (optionally AI-polished via the Anthropic SDK)
- Helmet, CORS, rate limiting, centralized error handling

**Frontend (`/client`)**
- React 18 + Vite, Redux Toolkit (auth/UI state), React Query (server state)
- React Router with protected routes
- Dark "quant lab" design system: glassmorphism panels, electric-cyan accents,
  a mathematical grid background, and a canvas backdrop of the actual
  derivative formulas (velocity/acceleration/jerk, Market Reynolds Number)
  from your own research drifting behind the UI
- KaTeX math rendering, Monaco Editor for Pine Script, d3-force knowledge graph
- Pages: Landing, Login/Register, Dashboard, Strategies (research-paper detail
  view + form), Backtests (list + full detail), Research Journal, Performance
  Analytics, Market Universe, Code Repository, Knowledge Graph, Reports, Settings

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
  file/image uploads to work (equity curve screenshots, CSVs, PDFs, avatars).
  The app runs fine without this; only upload endpoints need it.
- `ANTHROPIC_API_KEY` — optional, enables AI-polished report drafting.

```bash
npm run dev
```

API runs on `http://localhost:5000`. Health check: `GET /api/health`.

Optional demo data:
```bash
npm run seed
```
Creates a demo user (`demo@priyadarshiquantlab.com` / `demoPassword123`) with
one strategy carrying full Phase 2 data — math formulas, research sections,
a full-metrics backtest, equity curve, monthly heatmap, and rolling metrics —
so every new page has something to show on first run.

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
the Phase 1 + Phase 2 specs. A few pieces are intentionally left as extension
points rather than fully built out, since they depend on data you'll generate
as you use the app, or are substantial enough to warrant their own pass:

- **Equity curve / Monte Carlo / walk-forward CSV upload UI** — the data
  model fully supports this (`equityCurve`, `monteCarlo`, `walkForward`,
  `monthlyReturns`, `yearlyReturns`, `rollingMetrics`), and the Backtest Detail
  page renders all of it, but bulk CSV import isn't wired up yet — populate
  it via the API directly, the seed script (as an example), or extend the
  Backtest edit form.
- **Investor Presentation / Research Paper PDF formats** — PDF/DOCX/HTML
  export work out of the box; distinct visual templates for "investor deck"
  vs "institutional report" styling would need separate layout work.
- **Drag-to-pan/zoom on the Knowledge Graph** — it renders a live force
  simulation and is clickable, but doesn't yet support manual dragging of
  nodes or canvas panning.
- **AI Research Assistant** (a Phase 1 "bonus feature") is still not built —
  it's a substantial feature in its own right.

Everything else is functional end to end: auth, CRUD across all resources,
KaTeX math rendering, version control with rollback, the research-paper
strategy layout, the full backtest metrics model with charts, the 10-strategy
comparison engine, report auto-generation and multi-format export, the

profile system, and the knowledge graph.

