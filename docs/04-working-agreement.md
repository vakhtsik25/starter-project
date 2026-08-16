# 04 — Working Agreement (how we use GitHub together)

> Written for two nontechnical people. The whole point: both of us can edit safely at the same time without overwriting each other.

---

## The mental model (read this once)
- **Repo** = the shared folder in the cloud (on GitHub). Ours is `vakhtsik25/starter-project`, connected to Vercel.
- **`main`** = the official, agreed version. It's also what Vercel deploys. Treat it as protected.
- **Branch** = your own private copy where you make changes. Nothing you do on a branch affects the other person (or the live Vercel site) until you merge.
- **Pull Request (PR)** = "Hey, I'm done — please review and pull my changes into `main`."
- **Merge** = the other person approves, and your changes become official (and deploy).

Think of `main` as the printed, framed version on the wall, and a branch as a photocopy you scribble on. You only replace the framed one after the other person nods.

⚠️ Because `main` auto-deploys to Vercel: only merge to `main` when things aren't broken. Docs (markdown) are always safe. App code should build first.

---

## Rule #1 — Divide by file/area, so we almost never collide
Merge conflicts happen when two people edit **the same file** at the same time. We avoid this by owning different areas.

| Area | Primary owner (edits freely) | Other person |
|------|------------------------------|--------------|
| `docs/01-business-idea.md` | Person A | suggests via PR/comments |
| `docs/02-product-roadmap.md` | Person B | suggests via PR/comments |
| `docs/03-decision-log.md` | Whoever, but **add rows, don't rewrite** | |
| `app/` (the actual product code) | agree per-task who takes which file | |

Swap ownership whenever you like — just say so in chat and log it.

## Rule #2 — One branch per task, short-lived
Name branches so we can tell them apart:
- `a/customer-interviews`
- `b/roadmap-now-bucket`
- `a/landing-page`

Pattern: `yourinitial/what-you-are-doing`. Delete the branch after it's merged.

## Rule #3 — Small, frequent PRs beat giant ones
Finish a chunk → open a PR → get it merged same day. Don't sit on 3 days of changes. Small changes = tiny/no conflicts. Bonus: Vercel builds a **preview link** for every PR so you can see your change live before merging.

## Rule #4 — Sync before you start
Every work session, **pull the latest `main` first** (GitHub Desktop shows a "Pull origin" button). This keeps both copies current.

---

## The everyday loop (using GitHub Desktop — recommended for us)

1. Open **GitHub Desktop**. Click **Fetch/Pull origin** to get the latest.
2. **Current branch** (top bar) → **New branch** → name it `a/whatever`. Base it on `main`.
3. Edit the files (markdown in a text editor; app code in your editor).
4. Back in GitHub Desktop: type a short **Summary** of what changed → click **Commit to a/whatever**.
5. Click **Push origin**.
6. Click **Create Pull Request** (opens the browser). Add a one-line description → **Create**.
7. Ping your teammate. They open the PR, read the diff, check the Vercel preview link, click **Merge pull request**.
8. Both click **Pull origin** to get the merged `main`. Delete the branch.

That's the entire cycle. Repeat.

---

## If GitHub ever says "conflict" (rare if we follow Rule #1)
Don't panic and don't force anything. It just means you both edited the same lines. Message each other, decide which version wins, and if stuck, ask for help — it's fixable, nothing is lost.

---

## Where work happens vs. where it's discussed
- **Decisions & docs** → this repo (permanent).
- **Quick back-and-forth** → your chat app (WhatsApp/Slack/text).
- Rule: if a chat decision matters, someone copies it into [03-decision-log.md](03-decision-log.md).
