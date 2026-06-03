# Mobile Inventory Page Revamp — UltraPlan

**Page:** `/seller-central/inventory/[eventId]`
**Files:** `src/app/(sellers)/seller-central/inventory/[eventId]/page.tsx`, `src/components/features/seller-central/{bundle-card,item-card-v3,add-item-drawer,item-photo-strip}.tsx`, `src/components/features/inventory/{inventory-actions,sale-details-panel,SaleLifecycleMenu}.tsx`
**Date:** 2026-06-02
**Status:** Drafted (Opus). Implement in phases below.

---

## 1. Verdict

The page works but is **edit-first, dense, and unguided**. On a 375px screen a single sale demands ~4 screens of scrolling, every control is visible at all times, the same facts (title, listing value, status) repeat 3×, and a first-time seller has no idea what to do next. It reads like a form dump, not a guided workflow.

Goal of the revamp: **browse-first, edit-on-demand, one clear next action.** A seller should land, understand state in one glance, review items quickly, and publish — without hunting.

---

## 2. Problem Inventory (from screenshots, all perspectives)

### A. Redundancy / wasted vertical space
1. **Giant serif title** consumes ~3 lines / half the first screen. Decorative, not functional on mobile.
2. **Title shown 3×**: page header, collapsed "Sale details" panel row, and again truncated inside that panel.
3. **Status shown 2×**: meta-row "Ready for Review" badge + publish-bar "DRAFT REVIEW" pill.
4. **Listing value shown 3×**: meta row, sale-details panel, publish-bar total.
5. **Category shown 2× per item card**: pill beside the name AND a cell in the 2×2 attrs grid.
6. **Orphan separator dots** (`·` with nothing after) in the meta row.
7. **"Sale details" collapsed panel** is redundant with the header and unclear what it holds.

### B. Cognitive overload / no guidance
8. Every action is always visible: Edit details, Preview listing, bundle +/✎/🗑, item ⋯ menu, item Move/Details/Duplicate/Delete, Archive, Publish. Nothing signals priority.
9. **No "what's next"**: a new seller doesn't know the flow (review items → fill gaps → publish). No checklist, no progress.
10. **Two location paths**: meta-row "Add location" link vs. the address fields inside the Publish dialog. Confusing which is canonical.
11. Inline blur-save is **invisible** — no confirmation a change persisted.

### C. Item card density
12. Item card is **2 full screens tall**: capture bar + confidence pill + photo strip + name/category + description box + 2×2 attrs + retail/listing prices + 4-button footer. This is an *edit* surface forced into a *browse* context.
13. **"100% MATCH" confidence pill** — internal jargon, no seller value, pure noise.
14. **Empty "CATEGORY" pill** beside the name reads like a label, not a settable value.

### D. Data presentation bugs
15. **Price inputs show raw numbers** (`100000.00`, `1000000.00`) — no thousands separators, trailing `.00` noise, and the listing value **overflows / is cut off** (`$1000000.0…`).
16. **"1 items"** — pluralization bug in the context bar (and likely elsewhere).
17. Bundle/item names are AI-generated nonsense in test data ("Kitchen Gear Long Name…" bundle full of Sprite cans, $1,000,000 can) — not a code bug, but it exposes how badly the UI degrades with bad/long data and how hard rename is to find.

### E. Navigation / layout
18. **Bundle strip is not sticky** — scroll into items and the bundle switcher disappears; no way to jump bundles without scrolling back up.
19. **Primary CTA (Publish) is at the very bottom**, reachable only after scrolling past everything.
20. **Preview listing** opens a new browser tab — jarring on mobile.

### F. Consistency / polish
21. **`confirm()` native dialog** for bundle delete (added in last pass) — inconsistent with the app's custom dialogs elsewhere.
22. Tap targets on inline edit fields are small.

---

## 3. Design Principles for the Revamp

- **Browse first, edit second.** Default item card = compact read row. Tap to expand/edit (bottom sheet on mobile).
- **One source of truth per fact.** Title, status, value, location each appear once.
- **One primary action per state.** Surface the single next step; tuck the rest behind a menu.
- **Guide the seller.** A lightweight progress/checklist that resolves to a single "Publish" CTA.
- **Sticky context.** Keep the bundle switcher and primary CTA reachable while scrolling.
- **Format all money** through `formatAUD`; never show raw input numbers.

---

## 4. Phased Plan

### Phase 0 — Quick data/format fixes (low risk, high polish)
*Goal: kill the obviously-broken bits already visible.*
- **Money formatting in item card price inputs.** Display formatted AUD when not focused; switch to raw number only on focus for editing. Constrain width so large values never overflow (the `LISTING VALUE` cut-off). Files: `item-card-v3.tsx`.
- **Fix pluralization** everywhere: `1 item` / `N items`. Add a tiny `plural(n, "item")` helper in `src/lib/format.ts`. Files: `page.tsx`, `bundle-card.tsx`, `item-card-v3.tsx`.
- **Remove orphan `·` dots** in the meta row when the following value is empty/placeholder. Files: `page.tsx`.
- **Replace `confirm()` bundle delete** with the existing custom dialog pattern. Files: `page.tsx`.
- **Remove the "N% MATCH" confidence pill** from the item card capture bar (or demote to a tiny dot tooltip). Files: `item-card-v3.tsx`.
- **Drop the duplicate category pill** beside the item name (keep the one in the attrs grid). Files: `item-card-v3.tsx`.

**Acceptance:** No raw/overflowing numbers, no "1 items", no dead dots, consistent dialogs, less chrome on each card.

---

### Phase 1 — De-duplicate the header (reclaim the first screen)
*Goal: state understandable in one glance; title small; no triple-repeats.*
- **Compact header block** on mobile: small title (single line, ellipsis, tap → rename), one status chip, and a one-line meta strip (`N items · $value · location · date`). Remove the large serif treatment on mobile (keep desktop).
- **Delete the collapsed "Sale details" panel row** as a separate redundant element; fold "Edit details" into the header (pencil on the title / kebab). The full edit form stays in `SaleDetailsPanel` but is opened from one place only.
- **Single status source**: drop the publish-bar "DRAFT REVIEW" pill (or drop the meta-row badge) — keep exactly one.
- **Single location source**: the meta-row "Add location" and the Publish dialog address must read/write the same fields; "Add location" opens the same form the publish flow uses.
- **Better default title**: when the AI title is junk/over-long, fall back to `"{Suburb} Moving Sale"` or `"Untitled sale"` with an obvious rename affordance, rather than dumping the raw extraction string.

**Acceptance:** First screen shows title + status + meta + bundle switcher (no scroll). Each fact appears once.

---

### Phase 2 — Compact, expandable item cards (the big win)
*Goal: scan a bundle's items in one screen; edit on demand.*
- **Compact item row (default):** thumbnail, name, listing price, sale-status dot. ~64–72px tall. Tappable.
- **Expand to edit:** tap a row → **bottom sheet** (mobile) / inline expand (desktop) containing the current full editor (description, attrs, pricing, photos, actions). Reuse `ItemEditModal` / `item-card-v3` body — refactor the editor body into a shared piece used by both the sheet and desktop.
- **Move per-item destructive/secondary actions** (Move, Duplicate, Delete, Withdraw, Reserve) into the sheet's ⋯ menu, not the always-visible footer.
- **Photo strip** stays inside the expanded view, not the compact row.

**Acceptance:** A bundle with 5 items fits on ~1–1.5 screens. Editing one item never pushes the others off-screen.

---

### Phase 3 — Guided flow + sticky primary action
*Goal: the seller always knows the one next step.*
- **Readiness checklist** (small, dismissible) driving a single state machine: e.g. `Review items → Set categories (N left) → Add location → Publish`. Each row links to the relevant action. Collapses to a one-line progress when complete.
- **Sticky bottom action bar on mobile**: shows the single primary CTA for the current state (`Publish sale` / `Set 2 categories` / `Add location`), with total value inline. Replaces scrolling to the bottom publish bar. Reuse `InventoryActions` logic; render it in a sticky footer above the global tab bar.
- **Sticky bundle switcher**: make the mobile bundle strip sticky under the header so switching bundles doesn't require scrolling up.
- Demote `Archive`, `Unpublish`, `Preview` into a header kebab / overflow.

**Acceptance:** From any scroll position the next action is one tap away; first-time seller can complete publish without exploring.

---

### Phase 4 — Polish & consistency
- In-app preview (sheet/route) instead of `window.open` new tab on mobile.
- Save feedback: subtle inline "Saved" tick / toast on blur-save so inline edits feel committed.
- Empty/degraded-data states: graceful handling of missing images, junk titles, $0 prices.
- Tap-target audit (≥40px) on all inline controls.
- Re-run the 375px walkthrough; verify against `MOBILE_AUDIT` checklist.

---

## 5. Out of Scope
- Pricing-model sanity (e.g. $1M Sprite can) — that's backend/AI data quality, tracked separately.
- The Next.js dev `N` logo overlay (dev-only, not shipped).
- Desktop layout overhaul — desktop stays; changes are mobile-gated via `useIsMobile()` / Tailwind `sm:` unless noted.

## 6. Suggested Order & Risk
| Phase | Effort | Risk | Payoff |
|-------|--------|------|--------|
| 0 | S | Low | Immediate polish, removes "broken" feel |
| 1 | M | Low | Reclaims first screen, kills redundancy |
| 2 | L | Med | Biggest UX win; needs editor refactor |
| 3 | M | Med | Guidance + reachable CTA |
| 4 | S | Low | Final polish |

Ship 0 + 1 first (fast, visible). 2 is the structural change. 3 makes it genuinely guided.

## 7. Status
- Phase 0: ✅ Done (formatAUD display, plural, custom dialogs, no confidence pill, no dup category)
- Phase 1: ✅ Done (compact mobile header, single status, meta strip)
- Phase 2: ✅ Done (compact item rows + bottom sheet on mobile)
- Phase 3: ✅ Done (sticky bundle strip, sticky mobile CTA bar)
- Phase 4: ✅ Done (in-app preview router.push, "Saved ✓" flash on blur-save, $0→"No price" degraded state, 40px tap targets on bundle actions + sheet close)
