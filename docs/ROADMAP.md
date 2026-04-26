# SkipTheMid Roadmap

> Living document. Updated collaboratively by user + Claude across sessions.
> When scope or decisions change, update this file — don't rely on conversation memory.

## Vision

A dish-centric encyclopedia of **hyper-regional, unique dishes** the world doesn't know about. Wedge: niche over comprehensive. Avoid generic ("biryani"); favor specific ("Awadhi biryani", "Sajjappa").

This positioning drives every product decision. When in doubt: would TasteAtlas already have this? If yes, we go deeper / more niche / more honest.

---

## Workflow

**One branch per phase.** Branch is the unit of revert.

- Branch naming: `phase-N/<short-name>` (e.g. `phase-1/browse-discovery`)
- Small commits within the branch are fine and encouraged
- Merge to `main` with `git merge --no-ff` — the merge commit is what makes single-command revert possible
- **Never commit directly to `main`** during a phase, even for "small" changes
- **Never squash-merge** phase branches — preserves per-step history for debugging
- Mark phase Done in this file (with date + summary) in the same PR/merge
- Rollback in prod: `git revert -m 1 <merge-commit-sha>` → push → redeploy

---

## Open Questions

_Decisions pending — pull these into the next conversation._

- **Pagination vs infinite scroll** for `/dishes`: TBD. Claude leans: pagination (24/page) for SEO + back-button.
- **Dish-image script:** Deferred until after Phase 1. Open: swap Sajjappa for Litti Chokha (Wikimedia covers it), or add manual-URL fallback. Claude leans: manual fallback — needed for ~half of truly-niche dishes anyway.

---

## Phase 1.5 — SEO sprint (NOW)

Quick foundations to maximize organic discovery before Phase 2 content work.

**Scope (6 steps):**
1. **Per-route meta titles** — landing/map/dishes/dish all get keyword-leading titles. Dish format locked: `"${name} — ${origin} | SkipTheMid"`.
2. **Real H1 on landing** — current H1 is just the wordmark. Add semantic content H1 with keyword.
3. **robots.txt + sitemap.xml** — `app/robots.ts` + `app/sitemap.ts` (dynamic from Prisma). Update footer link to `/sitemap.xml`.
4. **Canonical on /dishes filter combos** → `/dishes` (option A — single canonical, not self-canonical). When Phase 2 ships country/region landing pages, those become canonical for their slice.
5. **JSON-LD Recipe schema** on every dish page — unlocks Google rich results.
6. **OG images per dish** — Next.js `ImageResponse` route. Design: dimmed dish photo + name + origin + brand mark.

**Manual follow-ups (post-merge, post-deploy):** submit sitemap to Google Search Console + Bing Webmaster Tools.

---

## Phase 2 — Curated content & SEO (NEXT)

- Country/region landing pages: `/cuisine/india`, `/region/karnataka`
- Curated lists: "Top 25 unsung Indian regional dishes", "Festival foods of South India"
- "Trending" / "Newly added" rails on landing page

---

## Phase 3 — Interconnection

- **Variations / siblings:** "Awadhi Biryani" → see also Hyderabadi, Kolkata, Sindhi
- **Ingredient pages:** `/ingredient/kokum` → all dishes using it
- **Pairings:** "Best paired with..." cross-linking

---

## Phase 4 — The differentiator

This is what makes the site memorable vs. just "another TasteAtlas":

- **Endangered dishes tag:** Dying out, only a few families make it, festival-only
- **"Where to actually eat this" honesty:** One trusted recommendation, or "this is a home dish, not on menus"
- **Origin stories:** Etymology, history, occasion, regional variations — encyclopedic depth
- **Story behind:** Short audio/video from someone who grew up with the dish

---

## Social / engagement (parallel track, no fixed phase)

- "Tried this" personal tracker (separate from rating)
- User-submitted places (use existing `Place` model)
- Bucket lists / favorites
- Per-dish OG share cards (auto-generated)

---

## Decisions log

_Append-only. Records WHY we chose something, so we don't relitigate later._

- **2026-04-25:** Roadmap kept in repo (`docs/ROADMAP.md`) over Claude memory dir. Reason: visible to user, version-controlled, editable directly. Claude reads it at session start.
- **2026-04-25:** Content additions (Indian dishes + image fetcher script) deferred until after Phase 1. Reason: empty browse page is fine to build against; content can backfill once UX exists.
- **2026-04-25:** One branch per phase (`phase-N/<name>`), merged with `--no-ff`, never squashed. Reason: makes a whole phase revertable in prod with a single `git revert -m 1`. Direct commits to `main` are forbidden during a phase.
- **2026-04-25:** Phase 1 landing layout = **B3 (hybrid map hero)**. Top ~55vh interactive Mapbox map with overlay title + CTA, then curated rails (capped, NOT full dump), then "Browse all dishes →" link to `/dishes`. Reason: map is the most distinctive UX; burying it at `/map` undersells it. Hybrid keeps storytelling space + SEO-friendly text below the map.
- **2026-04-26:** Header = **sticky (not fixed-overlay)** with **always-solid teal-900/95 background**. Reverted earlier "transparent over hero, solid on scroll" decision. Reason: user wanted clear, unobstructed view of map content under the header. Teal/turquoise palette chosen as primary header brand color. Scroll listener removed (no longer needed).
- **2026-04-26:** Filter taxonomy resolved. Added 5 fields to `Dish`: `continent` (required), `country` (required), `region` (optional state/province), `course` (required: street-food/main/dessert/appetizer/side/snack), `dietType` (required: vegan/vegetarian/non-vegetarian/contains-egg). All slug-style for URL safety (`/dishes?continent=asia&course=dessert`). Existing `category` retained as granular display tag separate from the broader `course` filter. Backfill via TAXONOMY map in seed.ts with hard-fail guard for any unmapped dish.

---

## Done

_Move items here as they ship. Keep the win — date + one-line summary._

- **2026-04-26 — Phase 1: Browse & discovery.** Landing redo (sticky teal header, brand-icon nav, non-interactive map hero, capped featured rail, branded footer). New `/dishes` page with continent/course/diet filters, debounced search across name+origin+cuisine+category+description, sort (A–Z/Z–A/Newly added/Most rated), and pagination (24/page). Schema gained `continent` / `country` / `region` / `course` / `dietType` with seed-time TAXONOMY map and hard-fail guard. Dish detail page readability bumped + ArrowLeft back link. Map pins + dish cards open in new tab. Branch: `phase-1/browse-discovery`.
