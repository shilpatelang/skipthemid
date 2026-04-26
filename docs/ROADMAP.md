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

- **Phase 1 layout:** Should `/dishes` be the new landing page, or stay as a sibling of `/` (with `/` becoming a curated showcase)?
- **Filter taxonomy:** Do we model `region` (e.g., "Karnataka") as a separate field on `Dish`, or piggyback on existing `origin` string? Schema change needed either way for filterable browsing.
- **Pagination vs infinite scroll:** TBD — depends on SEO priority (pagination is better for crawlers).
- **Dish-image script:** Deferred until after Phase 1. Current open question: swap Sajjappa for Litti Chokha (Wikimedia has it), or add manual-URL fallback to script.

---

## Phase 1 — Browse & discovery (NOW)

**Problem:** Landing page dumps all dishes inline. As list grows past ~30, UX collapses.

**Scope:**
- New `/dishes` page: card grid with search + filters + sort + pagination
- Filters: country/region, cuisine type, course (street food/dessert/main/snack), veg/non-veg, rating
- Sort: A–Z, most rated, recently added, by region
- Search: fuzzy match on dish name + origin
- Landing page (`/`) becomes curated: "Featured", "New this week", "Surprise me" CTA
- Promote `/map` as primary discovery path (not buried)

**Schema implications (TBD):**
- May need `region`, `course`, `dietType` fields on `Dish`
- Migration + seed update required

**Status:** Not started. Awaiting Plan from Claude before implementation.

---

## Phase 2 — Curated content & SEO

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

---

## Done

_Move items here as they ship. Keep the win — date + one-line summary._

- _(none yet)_
