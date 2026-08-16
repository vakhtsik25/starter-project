# 05 — Hackathon Plan (5–6 hours)

> Product: **Company Dossier** — a clean one-page investor view for any US public company, built entirely on free, public data (SEC EDGAR + curated data). No licensed sources, no API keys required for the core.

## The pitch (one sentence)
"A Bloomberg-terminal-style company snapshot for regular investors — historical financials, filings, an earnings calendar, and a where-to-park-your-cash comparison — starting from the primary source, SEC EDGAR."

## What we're building (MVP — must have)
1. **Ticker search** (e.g. AAPL) → loads a dossier
2. **Financials** — 5-year revenue, net income & EPS (from SEC EDGAR, no key)
3. **Recent filings** — latest 10-K / 10-Q / 8-K with links to SEC
4. **Company calendar** — recent filing dates + "add to calendar" (.ics) button
5. **Cash-parking table** — curated broker cash rates (IBKR 3.5%, etc.)
6. **Disclaimer footer** — "Informational only. Not investment advice."

## Stretch (only if ahead of schedule)
- Live next-earnings date (Finnhub free API key)
- "Beat or missed?" last quarter
- AI-written "key themes" from recent headlines

## Time-box (adjust as you go)
| Time | Focus | Who |
|------|-------|-----|
| 0:00–0:30 | Lock the idea (`01-business-idea.md`), agree scope = MVP list above | Both |
| 0:30–0:45 | Run the scaffold locally / open Vercel preview, confirm it loads a ticker | Both |
| 0:45–2:30 | **A:** financials + charts polish · **B:** filings + calendar + .ics | Split |
| 2:30–3:00 | Merge both branches, check Vercel preview | Both |
| 3:00–4:00 | Fill the cash-rate table with real numbers, style/polish, add disclaimer | Split |
| 4:00–4:45 | One stretch feature (pick ONE) | One person |
| 4:45–5:30 | Test 5 tickers (AAPL, MSFT, TSLA, a bank, a small-cap), fix bugs | Both |
| 5:30–6:00 | Demo script + pitch slide (incl. CapitalIQ/JPM as "premium roadmap") | Both |

## Golden rules for today
- **Ship the MVP before touching any stretch item.** A working small demo beats a broken big one.
- **One stretch feature max.** Time will disappear faster than you expect.
- **Test with a bank ticker** (e.g. JPM) — banks report revenue differently, good to catch early.
- If a data field is missing for some ticker, **show "n/a" gracefully** — don't crash the page.

## Division of work (different files = no merge conflicts)
- **Person A** → financials & charts section
- **Person B** → filings list, calendar/.ics, cash-rate table
- Both edit through short branches → PR → merge (see `04-working-agreement.md`)

## Demo script (2 min)
1. Type "AAPL" → dossier loads.
2. "All of this is pulled live from SEC EDGAR — the primary source."
3. Show financials → filings → click "add earnings to calendar."
4. Show cash-rate table: "where should idle cash sit?"
5. Vision slide: "Next: premium layers for licensed users (CapitalIQ, JPM research) and personalized insights."
