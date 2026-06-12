# Myrio Mobile 10/10 UltraPlan

Drafted 2026-06-12 after a full buyer + seller walkthrough of the Expo app (web preview 390×844, dev-bypass auth, local backend, seed data). Successor to `MOBILE_UI_ULTRAPLAN.md` (all 8 phases of which shipped 2026-06-11 — verified this session).

## Verdict & score: **7.3 / 10**

The wireframe era is over. Fraunces/Inter loaded, clay/cream tokens respected, hero cards + 2-col grid, center capture FAB, sticky CTAs, skeletons, empty states, working deep links. What separates 7.3 from 10 is: **one screen left behind (seller inventory), one web feature suite missing entirely (Settings), conversion friction on the item page, thin motion/haptics, and a handful of real bugs.**

| Category | Score | Evidence |
|---|---|---|
| Visual design / brand | 8.5 | Cohesive everywhere except seller inventory (106 raw hex, web-Tailwind greens/purples, zero thumbnails) |
| Navigation / IA | 9 | FAB tab shell, cold-start deep links fixed, back targets sane |
| Buyer browse → convert | 7.5 | Search + category chips + hero + grid ✓; item page: no Make-offer CTA, no gallery pager, no "More from this sale" rail |
| Messaging / offers | 7 | Offer→counter→accept→phone-reveal fully implemented incl. pinned card + deal banner; marred by bugs B1–B3 below |
| Seller flows | 7 | Capture permission gate + review + publish + item edit sheet (name/price/AI reprice/photo/delete/mark sold) ✓; inventory screen is the last wireframe; no bundle CRUD; no sale-card cover thumbs |
| Feature parity vs web | 6 | No Settings at all (web has 6 sections); no server search/filters; inventory cockpit depth missing |
| Polish (motion/haptics/a11y) | 7 | Skeletons + RefreshControl (18 uses) + 40 a11y roles ✓; Haptics in only 5 call sites, reanimated in 3 files, no `lib/motion.ts`, 40px tap targets in chat, deprecation warnings |

---

## Bugs found this walkthrough (P0)

| # | Bug | Evidence / root cause | Fix |
|---|---|---|---|
| B1 | **Dev-auth uid mismatch poisons all "mine" logic in dev.** `contexts/auth-context.tsx` sets `uid = DEV_USER_ID` (`"dev_user"`) but sends `DEV_TOKEN = "dev_" + DEV_USER_ID`; backend (`auth.py`) uses the **full token** as uid (`"dev_dev_user"`). Result in dev QA: own messages render left-aligned, own offers show Accept/Counter, counterpart resolution flaky | Set dev user `uid = DEV_TOKEN`. One line. (Prod unaffected — code logic `canAct = !isMine && pending` is correct) |
| B2 | **New conversation header shows "@Conversation" placeholder** until counterpart resolves | Show skeleton circle + leave name blank until loaded; pass seller username through route params from the originating screen so it renders instantly |
| B3 | **Pinned item card did not render** in a conversation started from an item, even though `startConversation` sends `{saleEventId, bundleId, itemId}` | Investigate backend pin → `pinSnapshot` population on conversation create (it may only populate on first message); mobile should also render from route-passed item as optimistic fallback |
| B4 | **Seller inventory screen off-system**: 106 raw hex values, web-Tailwind palette (mint banner, purple Mark-sold chips, green/amber status tags), no item thumbnails | Rebuilt in Phase 1 below |
| B5 | **Tap targets below 44pt**: offer + send buttons in chat are 40×40; audit others | Bump to ≥44 |
| B6 | **Console deprecations**: `shadow*` style props (Card) and `props.pointerEvents` | Move to `boxShadow` on web / platform-split; `style.pointerEvents` |
| B7 | **Sale cards on Sell tab have no cover image** though `cover_image_url` exists in payload | Add `ItemImage` thumb |

---

## Feature-gap matrix (web → mobile)

| Web feature | Mobile today | Verdict |
|---|---|---|
| **Settings — 6 sections** (Profile/avatar/bio/username · Account/email/password/SSO status · Contact & pickup · Notification toggles · Preferences (payment, pickup days/times, min-offer %) · Privacy (msg filter, visibility, blocked)) | **Nothing.** Profile tab = avatar row + 4 links + sign out | **Build (Phase 2)** — backend endpoints + `@myrio/types` prefs already shared |
| Inventory cockpit depth: bundle rename/delete, append items, multi-image strip + cover select, re-estimate, pricing reasoning, live processing view | Item edit sheet only (name/price/reprice/1 photo/delete) | **Build core subset (Phase 1)**: bundle rename/delete, image strip + cover, sale-level re-estimate, processing progress. Skip append-video (desktop job) |
| Marketplace search + filters (server-side, price/category/suburb) | Client-side filter over landing payload | **Build (Phase 4)** filter sheet + server params |
| Video-upload create flow | Absent (capture-only) | **Skip — deliberate.** Capture is mobile's marquee; video upload is a desktop job |
| Command palette / keyboard shortcuts | n/a | Skip — desktop idiom |
| Offer with anchoring (web thread shows item context, listed price) | Bare "Amount (AUD)" sheet, no context | **Build (Phase 3)** |
| Purchases, Saved, Notifications feed | Present ✓ | Parity ok |
| Google SSO login | Present (auth-session wired) | Verify on native build |

Mobile-only feature web lacks (keep investing): live camera capture → AI identify → review → publish.

---

## Phases to 10/10

### Phase 1 — Seller inventory cockpit rebuild (the last wireframe screen)
`app/seller/inventory/[eventId].tsx` → split into `components/seller/*`:
- Rewrite with UI kit: `ScreenHeader`, `Chip` semantic variants (kill purple/mint), `ItemImage` 56px thumbs on every row, `PriceText`.
- Live banner → status hero strip: status chip + item count + total value + Publish/Unpublish `Button`; processing states get indeterminate progress bar + live WS updates (port `use-inventory` polling/WS pattern from web).
- Bundle headers: rename (inline sheet), Mark-bundle-sold, collapse with `LayoutAnimation`.
- Item edit sheet upgrade: image strip (all `images[]`, tap to set cover, add from camera or library), pricing-reasoning line ("AI: priced from $1,299 RRP, Good condition"), withdraw/relist actions.
- Sale-level "AI re-estimate all" action.
- Sell tab cards: cover thumbnail (B7), relative dates.

**Exit:** zero raw hex outside `lib/theme.ts`; inventory screen indistinguishable in quality from Market.

### Phase 2 — Settings suite (kills the biggest parity gap)
New `app/settings/` stack from Profile tab, native idiom (grouped lists, not web's left-nav):
- `index` — grouped menu: Profile · Account · Contact & pickup · Notifications · Preferences · Privacy.
- `profile` — avatar upload (expo-image-picker), display name, bio, username with availability check + 7-day cooldown copy (reuse web `use-username` logic via shared package).
- `account` — email (read), password change, Google-linked badge.
- `contact` — AU mobile (E.164 mask), auto-share toggle, suburb/state picker from `@myrio/core` `SYDNEY_SUBURBS`.
- `notifications` — per-event switches (msg/offer/counter/deal/ready/viewed/buy_*/price_drop), auto-save on toggle + haptic tick.
- `preferences` — payment method pills, pickup days/times pills, min-offer slider (40–95%).
- `privacy` — messaging filter segmented control, profile visibility, blocked users list.
- Port `use-settings` hooks to mobile (endpoints + types already shared via `@myrio/api` / `@myrio/types`).
- Profile tab gets stats row (active sales · items sold · saved) and links into settings.

**Exit:** every web settings control reachable and functional on mobile.

### Phase 3 — Buyer conversion (item page closes the deal)
- **Sticky bar:** `Message seller` (primary) + **`Make offer`** (secondary) + heart. Offer opens the sheet *with context*: item thumb + name, listed price, quick-pick chips (−10% / −20% / custom), "seller's minimum is X%" hint when below `minOfferPercent`.
- **Gallery pager** when `images[] > 1`: swipe pages + dot indicator + pinch lightbox.
- **"More from this sale" rail** under specs (grid cards; data already in sale payload).
- Offer-sent → route into conversation with optimistic pinned card (fixes B3 UX even before backend fix).
- Sold/reserved items: status chip on detail + disabled CTAs with "See more from this sale" redirect.

**Exit:** buyer can go see-item → offer in 2 taps without typing anything but (optionally) a price.

### Phase 4 — Search & filters (server-truth)
- Market search field → debounced server search param; recent searches (AsyncStorage) under focused field.
- Filter sheet: price range, category, suburb/distance, sort (newest/price/ending-soon) — mirror web `marketplace-filters` param names; backend already filters marketplace queries.
- Category chips stay as quick filters; active-filter count badge on a filter icon button.
- Empty results state with "Clear filters" CTA.

**Exit:** search/filter results identical to web for same query.

### Phase 5 — Messaging trust & delight
- B1–B3 fixes land here if not done in P0 pass.
- Offer cards: item name caption ("Offer · King Bed Frame"), withdraw for own pending offer, accepted state = tertiary-green card + success haptic.
- Optimistic message send (instant bubble, spinner→tick), failed-send retry affordance.
- Unread: clay dot on avatar + bold preview; mark-read on open (verify).
- Conversation list rows: item thumb when pinned, "You: " prefix, day grouping.

**Exit:** negotiation flow feels instant and unambiguous about who offered what.

### Phase 6 — Capture signature moments (the 10/10 differentiators)
- Shutter: 72pt with capture-in-flight progress ring; identify result returns as **bottom sheet** (camera never hides); confirm = thumbnail "flies" into bottom-left stack (reanimated) + impact haptic.
- Running HUD chip: "4 items · ~$1,240" estimated value, ticking up on each confirm.
- Review screen: swipe-to-delete with undo snackbar, sticky "List N items →", total value in header.
- Sale published → full-screen success moment (check-draw animation + notification-success haptic + "View live sale" / "Share" actions).

**Exit:** capture→publish demoable as the app-store hero clip.

### Phase 7 — Motion, haptics, a11y systemization
- `lib/motion.ts`: press-scale spring, list entrance (fade + 4px rise, 30ms stagger, first load only), sheet springs. Apply via kit so screens inherit.
- Haptics map (today only 5 call sites): selection → tabs/chips/toggles; impact-light → shutter, heart; success → offer accepted, publish; error → failures.
- A11y audit: every interactive ≥44pt (B5), labels on icon-only buttons, contrast pass for `ink-300`-on-cream captions.
- Fix deprecation warnings (B6).

### Phase 8 — Quality gates & native verification
- ESLint no-raw-hex rule for `app/**` + `components/**` (theme.ts exempt) — locks in Phase 1.
- `pnpm type-check` green; screenshot sweep at 390px per phase.
- **Native build pass (Expo Go / dev build):** safe areas, keyboard avoidance in chat/auth, haptics actually firing, camera HUD, gallery gestures — web preview lies about all of these.
- Verify Google SSO on native; verify app icon/splash are Myrio-branded, not Expo defaults.

---

## Execution notes
- Order: P0 bug pass (B1, B5–B7 are minutes each) → Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Phases 1–4 are parity/conversion (take score to ~9); 5–7 are the delight layer that earns 10.
- Audit method (works, reuse): Expo web :8081 via preview server, comment Firebase keys in `apps/mobile/.env.local` for dev bypass, viewport 390×844. **Caveat:** dev uid mismatch (B1) makes message-ownership QA misleading until fixed. For seller-side QA, temporarily reassign a seed sale's `sellerId` to `dev_dev_user` in Firestore (and revert — seed sales belong to real uid `IRnHCqwOkCcTagOqrilpaIpsCgB2`).
- Out of scope (in `MOBILE_NATIVE_ULTRAPLAN.md`): push notifications, OTA updates, store listing.
