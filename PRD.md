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

**Finnhub** (free tier, only for stretch items). Requires `FINNHUB_API_KEY` as a Vercel env var — **never commit the key.** Endpoints: earnings calendar, earnings surprises.

## 6. Build Backlog (priority order — goal mode works top-down)

### Milestone 1 — MVP (must ship; mostly done)
- [x] Ticker search → dossier
- [x] Revenue / Net Income / EPS 5-yr charts from EDGAR
- [x] Recent filings with SEC links + `.ics` calendar export
- [x] Curated cash-rate table + "not investment advice" footer
- [ ] Replace placeholder `CASH_RATES` with 5+ real, dated, sourced rates
- [ ] Graceful states: loading indicator on search; friendly message for unknown/edge tickers; never render a blank/broken section
- [ ] Fix gap-year handling: only show contiguous recent fiscal years; label missing years "n/a" instead of dropping them silently
- [ ] Update page `<title>`/metadata in `app/layout.tsx` to "Company Dossier"

### Milestone 2 — Hackathon-day stretch (pick ONE if ahead)
- [ ] Live **next earnings date** via Finnhub, shown in a "Calendar" card with an `.ics` button
- [ ] **Beat or missed?** last-quarter EPS vs. estimate (Finnhub earnings surprises), with a green/red badge
- [ ] **Key themes** paragraph: summarize recent company headlines (label clearly as AI-generated)

### Milestone 3 — Post-hackathon vision (only after M1+M2)
- [ ] Links to the company's latest **investor presentation / IR deck** (curated per ticker, or IR-page link)
- [ ] Watchlist (save tickers, localStorage first)
- [ ] Compare two companies side by side
- [ ] Simple "own view" tracker: user records their expectation before earnings, app shows if it played out

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
