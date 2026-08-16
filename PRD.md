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

## 4a. Stock charting is consolidated on Goutham's `StockChart`
A teammate (Goutham) independently built `/stocks`: a candlestick chart with
moving averages and a draggable range brush, using `lightweight-charts`
(TradingView's library) + `yahoo-finance2` (a wrapper package) — see
`app/api/stock/[symbol]/route.ts`, `app/components/StockChart.tsx`,
`app/components/RangeBrush.tsx`. This is now the **only** price-charting
component in the app: `StockChart` was made embeddable (`symbol` /
`defaultRange` props hide the manual symbol input when controlled) and is
used both standalone at `/stocks` and embedded in `/company/[ticker]`'s
dashboard. The dashboard's original hand-rolled `LineChart` was deleted —
don't recreate it; extend `StockChart` instead if the chart needs to change.
Range presets cover `1D/5D/1M/6M` (other periods) and `1Y/2Y/3Y/4Y/5Y` (years),
configured in `RANGE_CONFIG` in the API route. `/stocks` and `/company/[ticker]`
still have **no cross-link** — worth adding a nav between them.

## 4b. Architecture (post-Milestone-4, restructured Milestone 5)
- `components/NavBar.tsx` — persistent top bar on EVERY page (in `app/layout.tsx`, not per-page): brand, general tabs (`Home`, `Stocks`, `Screener`, `Compare`), a global `SearchBox`, and `ThemeToggle`. This is the Capital-IQ-style shell — pages no longer render their own search/theme controls, NavBar owns those. `Home` stays active for both `/` and `/company/[ticker]` (tab logic keys off `usePathname()`).
- `/` — welcome prompt + Market Overview (major indices) + auto-generated snapshot paragraph.
- `/company/[ticker]` — the per-company dashboard: dense two-column "Stock Quote" + "Financial Information" info boxes (Capital-IQ-style `<dl>` rows via a local `Row` helper, not card tiles), embedded `StockChart`, tabs (**Overview / Analysis / Financials / Valuation / Analysts / Earnings / News / Insiders / Filings** — 9 tabs, built by two people in parallel and merged, see Milestone 8), CSV/PDF export.
- `/portfolio` — localStorage-only holdings tracker (ticker/shares/cost basis/date), cost vs. current value vs. gain, no account/sync. Goutham's, fully independent of everything above.
- `/stocks` — standalone candlestick/line stock explorer (Goutham's `StockChart`, free-form symbol entry).
- `/screener` — industry heatmap (Milestone 8) above a curated-universe table sortable by any of 7 performance periods (click a column header), with an industry-grouping toggle. See Milestone 7.
- `/compare` — peer comparison, up to 4 tickers, `?tickers=` in the URL. See Milestone 8.
- `/cash` — the cash-rate comparison table, **intentionally hidden**: not linked from NavBar or anywhere else, reachable only by typing the URL directly. This was a product decision (user asked to hide it), not a bug — don't add a nav link back to it without checking first.
- `lib/edgar.ts` — shared SEC EDGAR access: ticker/CIK resolution, name search, and `buildFinancialStatements()` (income statement, balance sheet, cash flow, shares outstanding).
- `lib/insider.ts` — SEC Form 4 XML fetch + parse (insider transactions). See Milestone 8 for the raw-XML-path discovery.
- `lib/company-metrics.ts` — shared `Dossier`/`PriceData` types, `computeMetrics()`, `yoyGrowth()`, `latestKnown()`. The dashboard, `/compare`, and the Analysis tab's growth math all import from here — don't reintroduce a local copy of this logic in a new page.
- `lib/scorecard.ts` — rule-based, numbers-only scorecard findings (no fabricated opinions — see Milestone 8's constraint).
- `lib/yahoo.ts` — `fetchChart()` (exported, shared low-level Yahoo fetch) + `getPriceData()` (live quote + 52wk range, used by the dashboard's summary boxes/multiples and the Home page's Market Overview). Separate from `StockChart`'s own `yahoo-finance2`-based fetch, which drives that chart specifically.
- `lib/stock-universe.ts` / `lib/stock-performance.ts` / `lib/market-snapshot.ts` — screener universe + multi-period return calculation, and the Home page's data-derived snapshot text.
- `lib/statements.ts` / `lib/export.ts` — shared statement-row shaping and CSV/PDF export (client-side, via `jspdf`).
- `components/` — `SearchBox`, `BarChart`, `StatementTable`, `ThemeToggle`, `NavBar`, `MarketOverview`. `app/components/` — `StockChart`, `RangeBrush` (Goutham's, kept in their original location).
- Theme: Tailwind v4 class-based dark mode (`@custom-variant dark` in `app/globals.css`), toggled via `ThemeToggle`, persisted to `localStorage["theme"]`, defaults to light (a pre-hydration script in `app/layout.tsx` avoids flash-of-wrong-theme; `<html>` has `suppressHydrationWarning` since the script intentionally changes its class before hydration).

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

### Milestone 5 — Capital-IQ-style shell (shipped)
- [x] Persistent top NavBar (brand, general tabs, global search, theme toggle) on every page via `app/layout.tsx` — replaces the per-page search/theme controls from Milestone 4
- [x] Cash-rate comparison hidden: moved to unlinked `/cash` (product decision, not a bug — don't re-link without checking)
- [x] Consolidated stock charting on Goutham's `StockChart` (candlestick + MAs), made embeddable, added 2Y/3Y/4Y ranges for full 1–5yr granularity (see Milestone 4a note above)
- [x] Dashboard summary restyled from card-tile grid to dense two-column "Stock Quote" / "Financial Information" info boxes, closer to the Capital IQ company-profile layout the user referenced
- [ ] (Not done) Cross-link between `/stocks` and `/company/[ticker]` — still separate, still worth reconsidering per Milestone 4a

### Milestone 6 — Home page market overview (shipped)
- [x] `app/api/market/overview/route.ts` — fetches S&P 500 (`^GSPC`), Nasdaq Composite (`^IXIC`), Dow Jones (`^DJI`), Russell 2000 (`^RUT`), and VIX (`^VIX`) in parallel via `lib/yahoo.ts`'s existing `getPriceData()` (index tickers work through the same free Yahoo endpoint, no new data source). VIX was our own addition beyond what the user asked for — a volatility/"fear gauge" reading fits the app's original anti-herd positioning.
- [x] `components/MarketOverview.tsx` — table with price, colored day change, and a small dependency-free SVG sparkline per index (1yr weekly series, reused from the same fetch).
- [x] `lib/market-snapshot.ts` — `buildMarketSnapshot()` builds a short paragraph **entirely derived from the fetched numbers** (S&P/Nasdaq direction, small-cap-vs-large-cap relative move, VIX level context) — no fabricated opinions or analysis. Clearly labeled on-page as auto-generated. If extending this, keep that rule.
- [x] `app/page.tsx` fetches once and passes the same data to both the table and the snapshot text, so they can't disagree.

Verified: real live data confirmed (Dow Jones figure exactly matched the reference S&P Capital IQ screenshot the user shared); sparklines render; snapshot correctly identified small-cap outperformance and a low VIX reading in a real test run.

### Milestone 7 — Stock screener: industry grouping + multi-period performance (shipped)
- [x] `lib/stock-universe.ts` — curated list of ~35 well-known large-cap US stocks tagged with industry (Technology, Financials, Healthcare, Consumer Discretionary, Consumer Staples, Energy, Industrials, Communication Services). **Not the full market** — screening thousands of tickers would mean thousands of Yahoo requests per page load. Extend by adding entries to this one file.
- [x] `lib/stock-performance.ts` — `getStockPerformance(ticker)` fetches `1y/1d` (covers 1D–12M) + `5y/1wk` (covers 5Y) via `lib/yahoo.ts`'s now-exported `fetchChart()`, and computes % return for each of `PERIODS = ["1D","1W","1M","3M","6M","12M","5Y"]` using a closest-point-at-or-before lookup (handles weekends/holidays gracefully; degrades gracefully — not incorrectly — if a stock has less history than the lookback window).
- [x] `app/api/stocks/screener/route.ts` — fetches performance for the whole universe in parallel (~70 Yahoo requests for 35 tickers × 2 ranges each; verified ~2.8s total, zero errors, no rate-limiting observed).
- [x] `app/screener/page.tsx` — table with Ticker (links to `/company/[ticker]`) / Name / Price / all 7 period columns. **Click any period column header to sort by it** (descending, best performers first). A **"Group by industry" checkbox** (default ON) groups rows under industry sub-headers, each group independently sorted by the active period; unchecked shows a flat cross-industry ranking with an Industry column.
- [x] Added "Screener" as a third NavBar tab.

Verified: all 35 stocks return real data with zero errors (e.g. NVDA +981.67% over 5Y — matches its well-known AI-driven rally); sorting by column and the group/flat toggle both re-order correctly; ticker links navigate to the existing company dashboard; dark mode and console are clean on a fresh tab.

### Milestone 8 — Analytical depth: insiders, peer comparison, growth analysis, heatmap (shipped)
User asked for "exciting, more analysis" features and named the target persona: MBA/finance students + self-directed retail investors who've outgrown Yahoo Finance but can't justify Bloomberg/CapIQ. Five features shipped:

- [x] **Insider transactions** (`lib/insider.ts`, `app/api/company/[ticker]/insiders/route.ts`, new "Insiders" dashboard tab). Parses raw SEC Form 4 XML directly — **not** a JSON API SEC doesn't offer one for this. Key discovery: `primaryDocument` in the submissions JSON points at the XSL-rendered viewer path (e.g. `xslF345X06/form4.xml`); the raw XML sits at the accession root under just its filename (verified across two different filer formats — AAPL's law-firm filer and TSLA's — by deriving the URL via `primaryDocument.split("/").pop()`, not by assuming a fixed filename). A regex-based extractor (`extractTag()`) pulls owner name/title/relationship flags and, per `<nonDerivativeTransaction>` block, date/code/shares/price — verified against real filings including a multi-transaction filing (Musk's option exercise + tax withholding on the same day) to confirm no field misalignment across transactions. Transaction codes are mapped to plain labels (P/S highlighted green/red as the real buy/sell signals; A/F/M/G/etc. shown neutrally since they're largely mechanical/compensation-related, not discretionary).
- [x] **Peer comparison** (`app/compare/page.tsx`, new "Compare" NavBar tab). Add up to 4 tickers (synced to `?tickers=` in the URL, so it's shareable), see Market Cap/P/E/P/S/P/B/Revenue/Revenue Growth/Net Income/margins/EPS side by side. Built entirely on existing `/api/company/[ticker]` + `/api/company/[ticker]/price` — no new data source.
- [x] **Growth & margin trend analysis + scorecard** (new "Analysis" dashboard tab). `lib/scorecard.ts`'s `buildScorecard()` produces 5 rule-based findings (revenue trend/streak, margin trend, FCF sign, leverage trend, EPS trend) — **every `detail` string is a plain restatement of real numbers, never a fabricated opinion or buy/sell call** (same discipline as `lib/market-snapshot.ts`); if you add a rule, keep that constraint. A per-year growth/margin table sits alongside it. Verified against both a stalling growth story (TSLA: revenue growth 51.4%→18.8%→0.9%→-2.9%, margin compression 10.3%→4.0%) and a hypergrowth story (NVDA: all 5 checks ✅, margin expansion to 55.6%) to confirm the good/warn paths both render correctly.
- [x] **Industry heatmap** (top of `/screener`, above the existing table). Average return per industry per period, computed client-side from data the screener already fetches — no new API. Color intensity is normalized **per period column** (not globally) via `color-mix(in srgb, var(--positive|--negative) N%, transparent)`, so the color scale stays meaningful whether the column is 1D (spans a few %) or 5Y (spans hundreds) — and the CSS variable approach means light/dark mode need no extra handling (verified: dark mode correctly resolved to the dark theme's own `--positive` color).
- [x] Refactored `lib/company-metrics.ts` out of the dashboard's inline multiples calculation so the dashboard, Compare page, and Analysis tab's growth math all share one implementation (`computeMetrics()`, `yoyGrowth()`, `latestKnown()`) instead of three copies that could drift apart.
- [x] Added "Compare" as a fourth NavBar tab (alongside Home/Stocks/Screener).

Verified end-to-end on a fresh tab: all four new surfaces render with real data and zero console errors, dark mode works throughout, and the pre-existing Financials/Filings tabs and CSV/PDF export were re-tested after the `company-metrics.ts` refactor to confirm no regression.

### Milestone 8b — Merged with a second round of parallel teammate work
While Milestone 8 was in progress, Goutham independently shipped an overlapping
batch to `main` via PR #3: `News`, `Analysts`, `Earnings`, `Valuation` tabs on
the dashboard (using `yahoo-finance2`, same as `StockChart`) plus a fully
independent `/portfolio` (localStorage holdings tracker). Two genuine
collisions, both reconciled:
- **Multiples calculation duplicated**: Goutham had also extracted the
  dashboard's inline multiples calc, into `lib/multiples.ts`'s
  `computeMultiples({dossier, price})` (object-arg) — functionally a subset
  of this session's `lib/company-metrics.ts` `computeMetrics(dossier, price)`
  (positional-arg, plus growth/margin fields `computeMultiples` didn't have).
  Resolution: `lib/company-metrics.ts` is now the ONLY multiples/growth
  implementation; `components/PeerValuation.tsx` was updated to import from
  it instead. `lib/multiples.ts` was trimmed to just `formatUSD` (still used
  by `/portfolio`) — don't add multiples-calculation logic back into it.
- **Peer comparison duplicated**: Goutham's `PeerValuation` (a "Valuation" tab
  *within* one company's dashboard — add peers, compare against the company
  you're already viewing) vs. this session's standalone `/compare` (its own
  NavBar tab, shareable via `?tickers=`, more metrics: growth rates, margins).
  Both kept — they're genuinely different workflows, not true duplicates, and
  both are now proven to render identical numbers for the same ticker (since
  both call `computeMetrics`). Don't build a third peer-comparison surface
  without checking these two first.
- The dashboard's 9-tab `TABS` array order (`Overview, Analysis, Financials,
  Valuation, Analysts, Earnings, News, Insiders, Filings`) and the combined
  data-fetching `useEffect` (price + insiders + news + analysts + earnings,
  all best-effort/independent try-catch blocks) were hand-merged — git's
  auto-merge handled everything except these interleaved edits to the same
  few functions. Verified rebuilt clean and re-tested every tab plus
  `/portfolio` afterward.

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
