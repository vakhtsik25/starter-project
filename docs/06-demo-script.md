# 06 — Demo Script

> Goal: 2 minutes, one company, one honest story, one zoom-out. Don't click
> through all 9 tabs — that reads as "we built a lot of features," not "we
> solved a problem." Rehearse this out loud at least twice before presenting.
> Numbers below were live as of 2026-08-16 — re-check them the morning of
> your presentation with `curl https://starter-project-flax.vercel.app/api/company/TSLA` since the app pulls real, moving market data.

## Before you start
- Open the live production URL, not localhost: **https://starter-project-flax.vercel.app**
- Pre-load `/company/TSLA` in one tab and `/screener` in another, so you're not typing during the demo.
- Set light or dark mode ahead of time — whichever looks better on the projector — and don't touch the toggle live.
- Know your one-liner cold, say it before touching the keyboard.

## The one-liner (memorize this, say it first)
> "Individual investors don't have a Bloomberg terminal. We built one — using only free, legal data — and we made it tell the truth even when a stock is hyped."

---

## Part 1 — The hook (10 seconds)
Say the one-liner above. Don't explain more yet. Then: *"Let me show you on Tesla — a stock everyone has an opinion about."*

Navigate to `/company/TSLA` (or click there live from the search bar — either is fine, but faster if pre-loaded).

## Part 2 — The honest story (60–70 seconds)
This is the core of the demo. One company, two tabs, a real narrative.

**1. Glance at the header (5 sec)** — point at the price and the candlestick chart.
> "Real-time price, real financials, pulled live from SEC filings and the market — not a mockup."

**2. Click the "Analysis" tab (25–30 sec)** — this is your best differentiator. Read the scorecard findings out loud, they tell a real, non-hyped story:
> "Here's the part that matters: our tool doesn't cheerlead. It read Tesla's own SEC filings and flagged: revenue growth went from 51% two years ago, to 19%, to basically flat, to **negative** last year. Margins compressed from 10% to 4%. This is automatically generated — straight from the numbers, no opinion injected. That's the whole thesis: **don't just follow the hype, follow the filings.**"

*(Live figures to reference if asked: revenue $53.8B → $81.5B → $96.8B → $97.7B → $94.8B, 2021–2025; net margin 10.3% → 4.0%.)*

**3. Click the "Insiders" tab (25–30 sec)** — the "wow, I didn't know you could see that" moment.
> "This comes straight from SEC Form 4 filings — nobody else's free tool parses these. Here's Elon Musk exercising options on 304 million shares — about $7 billion — the same day as a matching tax-withholding transaction. This is public information, but almost nobody can actually see it laid out like this."

## Part 3 — The zoom-out (25–30 seconds)
Switch to the pre-loaded `/screener` tab.

> "That's one company. Here's the whole market at once."

Point at the **Industry Heatmap** at the top:
> "Technology is up 273% over 5 years on average — mostly carried by Nvidia at nearly 1,000%. Communication Services is actually down 16%. You'd never guess that just watching the news."

Click one period column header (e.g. "5Y") to show live sorting:
> "Every column is sortable, every stock links back to the same deep-dive you just saw."

## Part 4 — The close (15 seconds)
> "Everything you just saw — filings, insider trades, real-time prices — is free and public. We deliberately built this on SEC EDGAR and public market data instead of scraping a licensed terminal, because we wanted something that's actually legal to ship, not a demo that falls apart under scrutiny. That's FinLens."

Stop talking. Let it land. Don't keep clicking.

---

## If you have 60 more seconds (optional Part 5)
Pick **one** of these, not both:
- **Compare**: `/compare?tickers=TSLA,GM,F` — "or size Tesla up against the legacy automakers in one table."
- **Portfolio**: `/portfolio` — "and if you actually own the stock, track your real cost basis vs. today's price, no account required — it never leaves your browser."

## Anticipated judge questions (have these ready, don't ad-lib)
- **"Is this legal?"** — "Yes. Every data source is free and public: SEC EDGAR for filings, Yahoo Finance's public endpoints for prices. We explicitly avoided scraping licensed platforms like Bloomberg or CapitalIQ."
- **"Isn't this just Yahoo Finance?"** — "Yahoo Finance doesn't surface insider Form 4 filings in a usable way, doesn't compute a growth/margin scorecard from the actual statements, and doesn't group performance by industry with a heatmap. We built the analysis layer on top of the raw data."
- **"What's next?"** — Pick one honest answer: a watchlist with alerts, TTM (trailing-twelve-month) multiples using quarterly data, or expanding the screener universe beyond the curated 35 stocks.
- **"How long did this take?"** — Be honest: started as a 5–6 hour hackathon build, extended over several focused sessions by two people working in parallel branches.

## What NOT to do live
- Don't open all 9 dashboard tabs "to show everything."
- Don't demo the theme toggle — it's a nice detail, not a talking point.
- Don't apologize for what's missing. If asked about a gap, answer honestly and move on — don't dwell.
- Don't read numbers off a slide if the live app can show them — always prefer the live app, it's more convincing than a screenshot.
