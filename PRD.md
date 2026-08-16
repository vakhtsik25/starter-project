# PRD — Company Dossier

> **How to run this in Claude Code goal mode:** point Claude Code at this file and give it a goal like
> *"Read PRD.md and complete the highest-priority unchecked item in the Build Backlog. Work on a new branch, keep `npm run build` passing, then open a PR. Do not merge to main."*
> Repeat per item. Ship Milestone 1 fully before starting Milestone 2.

---

## 1. One-liner
A Bloomberg-terminal-style company snapshot for regular investors — historical financials, filings, an earnings calendar, and a where-to-park-cash comparison — built entirely on free, public data (primarily SEC EDGAR).

## 2. Goal / Definition of Done
A deployed website where a user types a US stock ticker and instantly sees a clean, trustworthy one-page "dossier" for that company, sourced from primary/public data, with a clear "not investment advice" stance. Success at the hackathon = a stranger can open the live Vercel URL, type `AAPL`, and understand the company's financial trajectory in 30 seconds.

## 3. Users & Value
- **Primary user:** an individual retail investor who finds Bloomberg/CapitalIQ inaccessible and Yahoo Finance shallow.
- **Value:** primary-source data (SEC filings), presented simply, plus decisions the crowd ignores (where idle cash should sit). Anti-herd: help individuals form their own view of whether a company hit or missed its targets.

## 4. Current State (already built — DO NOT rebuild)
Stack: **Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 + TypeScript.** Repo `vakhtsik25/starter-project`, auto-deploys `main` to Vercel.

Implemented and verified working (tickers AAPL, MSFT, JPM, TSLA):
- `app/page.tsx` — client page: ticker search; Revenue / Net Income / Diluted EPS 5-yr bar charts; recent filings list with SEC links + per-filing `.ics` "add to calendar"; curated cash-rate table; "not investment advice" footer.
- `app/api/company/[ticker]/route.ts` — server route pulling from SEC EDGAR (no API key needed).
- Charts are dependency-free CSS bars (no chart library) for build reliability.

Known rough edges (fair game to fix):
- Some tickers show a **gap year** in financials (e.g. TSLA shows a stray 2018) due to inconsistent historical XBRL `fy` tagging. Must never crash — show gracefully.
- Cash-rate numbers in `CASH_RATES` are **placeholders** — need real, verified, dated values.
- No loading skeletons; minimal error states.

## 4a. A second stock-price feature exists — `/stocks`
A teammate (Goutham) independently built `/stocks`: a candlestick chart with
moving averages and a draggable range brush, using `lightweight-charts`
(TradingView's library) + `yahoo-finance2` (a wrapper package, vs. this repo's
own hand-rolled `lib/yahoo.ts` fetch calls) — see `app/api/stock/[symbol]/route.ts`,
`app/components/StockChart.tsx`, `app/components/RangeBrush.tsx`. It merged
into `main` cleanly (additive, no shared files touched) alongside the
Milestone 4 dashboard work below. The two pages currently have **no cross-link**
— `/stocks` isn't reachable from `/` or `/company/[ticker]` and vice versa.
Worth adding a nav link between them, and worth deciding whether `/stocks`'
approach (real candlesticks + MAs) should eventually replace the dashboard's
simpler `LineChart` — don't duplicate effort on stock charting without
checking both places first.

## 4b. Architecture (post-Milestone-4)
- `/` — landing page: search-by-ticker-or-name (autocomplete), the curated cash-rate table, theme toggle.
- `/company/[ticker]` — the per-company dashboard: price + multiples cards, 1yr price chart, tabs (Overview / Financials / Filings), CSV/PDF export.
- `lib/edgar.ts` — shared SEC EDGAR access: ticker/CIK resolution, name search, and `buildFinancialStatements()` (income statement, balance sheet, cash flow, shares outstanding).
- `lib/yahoo.ts` — free live price + 1yr history via Yahoo's public (unofficial, no-key) chart endpoint.
- `lib/statements.ts` / `lib/export.ts` — shared statement-row shaping and CSV/PDF export (client-side, via `jspdf`).
- `components/` — `SearchBox`, `BarChart`, `LineChart`, `StatementTable`, `ThemeToggle`.
- Theme: Tailwind v4 class-based dark mode (`@custom-variant dark` in `app/globals.css`), toggled via `ThemeToggle`, persisted to `localStorage["theme"]`, defaults to light (a pre-hydration script in `app/layout.tsx` avoids flash-of-wrong-theme).

## 5. Data Sources (all free / public — verified)
**SEC EDGAR** (no key). Always send a descriptive `User-Agent` header (e.g. `starter-project (email)`); cache responses (~1h) and stay well under ~10 req/s.
- Ticker → CIK map: `https://www.sec.gov/files/company_tickers.json` (pad `cik_str` to 10 digits).
- Company facts (financials): `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json`.
- Submissions (filings, SIC): `https://data.sec.gov/submissions/CIK{cik10}.json`.
- Annual series = filter entries where `form === "10-K"` and `fp === "FY"`, key by `fy`, take last 5 years.
- Concept fallbacks (use first that exists):
  - Revenue: `RevenueFromContractWithCustomerExcludingAssessedTax` → `Revenues` → `SalesRevenueNet` (unit `USD`).
  - Net income: `NetIncomeLoss` (unit `USD`).
  - EPS: `EarningsPerShareDiluted` → `EarningsPerShareBasic` (unit `USD/shares`).
- Filing URL: `https://www.sec.gov/Archives/edgar/data/{cikNoLeadingZeros}/{accessionNoDashes}/{primaryDocument}`.

Annual figures for revenue/net income/EPS AND balance sheet/cash flow are keyed by the reporting period's `end` date, not the `fy` field — a single 10-K reports 2-3 years of comparatives and EDGAR stamps ALL of them with the filing's own `fy`, so keying by `fy` silently collides distinct periods. `lib/edgar.ts`'s `annualSeries()` resolves this (see its comments) — do not revert to fy-keying if refactoring.

**Yahoo Finance chart API** (free, unofficial, no key — `lib/yahoo.ts`). `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=...&interval=...`. Two calls are combined: `range=5d&interval=1d` for an accurate current price + true previous-close (Yahoo's `chartPreviousClose` is relative to whatever range you request, so a `range=1y` call gives a stale "previous close" — don't use it for day-change), and `range=1y&interval=1wk` for the chart series. If Yahoo ever blocks this, the next-best free fallback needs research (Stooq is bot-gated and returned a JS challenge page during testing).

**Finnhub** (free tier, only for stretch items). Requires `FINNHUB_API_KEY` as a Vercel env var — **never commit the key.** Endpoints: earnings calendar, earnings surprises.

## 6. Build Backlog (priority order — goal mode works top-down)

### Milestone 1 — MVP (must ship; mostly done)
- [x] Ticker search → dossier
- [x] Revenue / Net Income / EPS 5-yr charts from EDGAR
- [x] Recent filings with SEC links + `.ics` calendar export
- [x] Curated cash-rate table + "not investment advice" footer
- [x] Replace placeholder `CASH_RATES` with 5+ real, dated, sourced rates (see docs/03-decision-log.md for sources; dated "August 2026")
- [x] Graceful states: loading indicator (animated skeleton) on search; friendly 404 message for unknown tickers (verified with ZZZZ); cash table always renders even on error
- [x] Fix gap-year handling: merged across XBRL concept fallbacks so genuine data fills real gaps (fixed TSLA's stray-2018 bug); any true remaining gap renders as "n/a" without crashing (verified in code + BarChart component)
- [x] Update page `<title>`/metadata in `app/layout.tsx` to "Company Dossier"

### Milestone 2 — Hackathon-day stretch (pick ONE if ahead)
- [ ] Live **next earnings date** via Finnhub, shown in a "Calendar" card with an `.ics` button
- [ ] **Beat or missed?** last-quarter EPS vs. estimate (Finnhub earnings surprises), with a green/red badge
- [ ] **Key themes** paragraph: summarize recent company headlines (label clearly as AI-generated)

### Milestone 3 — Post-hackathon vision (only after M1+M2)
- [ ] Links to the company's latest **investor presentation / IR deck** (curated per ticker, or IR-page link)
- [ ] Watchlist (save tickers, localStorage first)
- [ ] Compare two companies side by side
- [ ] Simple "own view" tracker: user records their expectation before earnings, app shows if it played out

### Milestone 4 — Dashboard expansion (shipped)
- [x] Dark/light theme toggle, light default, persisted, no flash-of-wrong-theme
- [x] Search by company name (not just ticker) with autocomplete
- [x] Download full financial statements (Income Statement, Balance Sheet, Cash Flow) as CSV and as PDF
- [x] Per-company dashboard at `/company/[ticker]` (CapitalIQ/AlphaSense-inspired): price/multiples cards, tabs, statement tables
- [x] Stock price history (1yr) + live quote + day change via Yahoo Finance; P/E, P/S, P/B multiples computed from EDGAR fundamentals + live price
- [ ] (Not done) Trailing-twelve-month (TTM) multiples — current P/E/P/S/P/B use latest FY figures, labeled "(FY)"; a TTM version would need quarterly (10-Q) data merged in
- [ ] (Not done) EV/EBITDA — skipped; total debt isn't consistently tagged across companies, would need a fragile fallback chain

## 7. Non-Goals / Out of Scope (do NOT build)
- ❌ **No CapitalIQ or JP Morgan research integration, scraping, or data redistribution.** These are licensed sources; using them in this app violates their terms. Public data only.
- ❌ No user accounts, auth, or storing personal data (for the hackathon).
- ❌ No real-money features (trading, transfers, brokerage connections).
- ❌ No personalized buy/sell/hold advice generated by the app.

## 8. Guardrails & Compliance (always enforce)
- Every view shows: *"For informational and educational purposes only. Not investment advice."*
- Present data and **aggregated** third-party ratings only; the app never tells a user to buy/sell a specific security.
- Secrets live in Vercel env vars, never in the repo. `.env*` stays git-ignored.
- Respect data-source terms and rate limits; cache to avoid hammering EDGAR.

## 9. Engineering Conventions
- Work on short-lived branches (`initial/task`), open a PR, keep `npm run build` green, **never push directly to `main`** (it auto-deploys). See `docs/04-working-agreement.md`.
- Prefer no new dependencies unless clearly justified (keeps the build fast and reliable).
- Match the existing code style in `app/page.tsx` and the API route.
- New data fetching goes in server route handlers under `app/api/…`, not client-side (keeps keys server-side and avoids CORS).

## 10. Verification / Acceptance
Before calling any item done:
1. `npm run build` passes (TypeScript + lint clean).
2. Manually test these tickers and confirm no crashes and sensible data: **AAPL, MSFT, JPM (bank), TSLA (gap-year case), and one invalid ticker like ZZZZ** (must show a friendly "not found").
3. Confirm the Vercel **preview** deployment for the PR renders correctly.
4. Definition of done for Milestone 1: live production URL loads, `AAPL` returns full financials + filings, cash table shows real numbers, disclaimer present.
