# Myrio Mobile UI/UX UltraPlan

Drafted 2026-06-11 after a full walkthrough of the Expo app (web preview at 390px, dev-bypass auth, local backend, seed data). Companion to `MOBILE_NATIVE_ULTRAPLAN.md` (which covers architecture/phasing — this plan covers **design quality**).

**Verdict from the walkthrough:** the app is functionally complete but visually a wireframe. Every screen is a flat cream page with a bold title, hairline borders, default system font, spinner-only loading, emoji placeholders, and zero motion. There is **no `components/` directory** — every screen re-implements its own cards, chips, buttons, and headers with inline `style={{}}` objects and hardcoded hex values. That is the root cause of the "looks bad" feeling: no system, no hierarchy, no polish layer.

---

## Bugs found during the walkthrough (fix first — P0)

| # | Bug | Evidence | Fix |
|---|-----|----------|-----|
| 1 | **Cold-start deep link crashes the app.** Navigating directly to `/login`, `/notifications`, etc. throws `Attempted to navigate before mounting the Root Layout component` | Reproduced on web; same race exists on native push-notification deep links | In `app/_layout.tsx` `AuthGate`, guard the redirect until the root navigator is mounted (`useRootNavigationState()?.key` check before `router.replace`) |
| 2 | **Capture screen crashes on web** — `expo-keep-awake` `WakeLock: page not visible` uncaught | `/capture` on web preview | Wrap `activateKeepAwakeAsync()` in `try/catch` + `Platform.OS !== "web"` guard (cheap; keeps Expo web dev usable) |
| 3 | **All images 503** — signed GCS URLs (`shiftready-uploads-bucket` signed by `myrio-backend-sa@myrio-platform`) fail | Every thumbnail/cover blank in the walkthrough | Backend/env issue from the Myrio GCP migration — bucket and signing SA live in different projects. Fix in `shiftready-backend` config (not a UI task, but blocks any visual QA) |
| 4 | **Dependency drift** — `expo start` warns on 10 packages (`react@19.2.4` vs expected `19.0.0`, `react-native-web@0.21` vs `^0.20`, `expo-auth-session@56` vs `~6.2.1`(!), etc.) | Metro startup log | Run `npx expo install --check` and align; the pnpm root override pinning `react: 19.2.4` conflicts with Expo 53's expected 19.0.0 — scope the override to web only |

---

## Design-system gaps (root causes)

1. **No shared UI kit.** Zero files under `apps/mobile/components/`. Cards, chips, badges, buttons, headers, empty states, list rows are copy-pasted per screen with drifting values (e.g. status pill colors in `sell.tsx` use web-Tailwind stone/amber hexes that clash with the clay/cream palette).
2. **Hardcoded hex everywhere.** Screens bypass the NativeWind tokens (`tailwind.config.ts` has the full clay/cream/ink scale) and inline `#B5604A`, `#E0D5C0`, `#A09683`… Restyling is currently impossible without touching every file.
3. **Default system font.** No `expo-font`. Web app has a brand voice; mobile renders Roboto/SF default at default weights. Single biggest "cheap" signal.
4. **No motion.** `react-native-reanimated` is installed but unused in screens. No press scale, no list entrance, no skeletons (spinner-only loads), no layout animation on accordion expand/collapse.
5. **Emoji as UI.** 📦 placeholders for missing images, 💬 / 🔔(colored system emoji) / 🛍 in empty states — inconsistent with Ionicons used elsewhere, and colored emoji ignore the palette.
6. **No haptics outside capture.** `expo-haptics` installed; tabs, buttons, pull-to-refresh, offer actions are silent.
7. **No accessibility pass.** No `accessibilityRole`/`Label` anywhere; `#A09683` on cream fails WCAG AA for small text; some tap targets < 44pt.
8. **No dark mode.** Acceptable to defer (web is dark-only, mobile is light-only — inconsistent but deliberate); tokenizing colors in P1 makes it cheap later.

---

## Phase P1 — Foundation: UI kit + typography (everything else depends on this)

**New: `apps/mobile/components/ui/`**

| Component | Spec |
|---|---|
| `Text.tsx` (`AppText`) | Typed variants: `display` (28/34 bold), `title` (22/28 bold), `heading` (17/24 semibold), `body` (15/22), `caption` (13/18), `micro` (11/14 medium, tracking +0.5, uppercase opt). All use brand font, `color` prop limited to token names |
| `Button.tsx` | `primary` (clay-600 fill, white text), `secondary` (cream-100 fill, ink text), `ghost`, `destructive`. Sizes `lg` (52pt) / `md` (44pt). Pressed: scale 0.97 (reanimated) + `Haptics.selectionAsync()`. Loading state swaps label for spinner, keeps width |
| `Card.tsx` | surface-container-low bg, radius 16, border outline-variant, optional `onPress` with scale press feedback. Soft shadow (`boxShadow` — the `shadow*` props are deprecated on web, warning already in console) |
| `Chip.tsx` | meta chip (icon + label, cream-100) and status chip (semantic variants: `live`, `processing`, `sold`, `reserved`, `urgent`, `deal` — single source of truth replacing `sell.tsx` STATUS_STYLE and inline SOLD/RESERVED pills) |
| `Avatar.tsx` | initial-based, deterministic bg from username hash across clay/cream/ink hues (today every avatar is identical clay) |
| `Skeleton.tsx` | reanimated shimmer block; compose per-screen skeletons (`SaleCardSkeleton`, `ItemRowSkeleton`, `ConvRowSkeleton`) |
| `EmptyState.tsx` | icon (Ionicons, outline, 48, outline color) + title + body + optional CTA Button. Replaces all 6 divergent empty states |
| `ScreenHeader.tsx` | two modes: large-title tab header (with optional right actions slot) and back-nav stack header (back chevron 44pt target, centered title, right slot). Handles safe-area top inset internally — kills the per-screen `paddingTop: insets.top` |
| `ItemImage.tsx` | `expo-image` with `placeholder` blurhash/recyclingKey, contentFit cover, fallback = Ionicons `cube-outline` on surface-container-high (kills 📦) |
| `PriceText.tsx` | tabular-nums, clay-600, single formatter from `@myrio/core` `formatAUD` (three duplicate `fmtAUD` definitions exist today) |

**Typography:** add `expo-font` + `@expo-google-fonts/fraunces` (display/titles — warm, editorial, fits the cream/clay brand) and `@expo-google-fonts/inter` (UI text). Load in `_layout.tsx` behind the existing splash. Wire families into `tailwind.config.ts` `fontFamily` tokens.

**Token discipline:** ESLint rule (or convention + one sweep) — no raw hex in `app/**`; everything via NativeWind classes or a `theme.ts` export. Add semantic aliases used by chips: `success`, `warning`, `info` tuned to the cream/clay world (NOT web-Tailwind green/amber/blue defaults).

**Exit:** all 9 components exist, fonts load, no screen code changed yet.

---

## Phase P2 — Navigation shell

`app/(tabs)/_layout.tsx`:

- **Center capture FAB.** Reorder tabs to `Market · Saved · [Sell] · Messages · Profile` with Sell as a raised 56pt clay circle (camera icon) floating above the bar — it's the core differentiator (point camera, AI lists it) and deserves the marquee position. Tapping it goes straight to `/capture` if the user has a sale in progress, else to the Sell hub.
- Custom `tabBar` component: translucent surface with top hairline, 49pt + safe-area, active tab = filled icon + label clay-600, inactive = outline icon ink-300, `Haptics.selectionAsync()` on switch, subtle 200ms icon scale on focus.
- Keep the unread badge; render via `Chip` count style (today's `tabBarBadge` is fine functionally).
- Fix bug #1 (AuthGate mount guard) here too since it's the same file family.

**Exit:** shell feels native; capture is one tap from anywhere.

---

## Phase P3 — Market (the storefront — highest buyer impact)

`app/(tabs)/index.tsx` (split into `components/market/*`):

1. **Header**: greeting/eyebrow line ("Moving sales near you") + `Myrio` wordmark in Fraunces; right side: notifications bell (currently buried in Profile!) with unread dot. Below: **search field** (placeholder "Search sofas, desks, brands…") + horizontally scrollable **category chips** (All · Furniture · Appliances · Electronics · Outdoor · …). Client-side filter over the landing payload first; server search param later.
2. **Sales carousel → hero cards**: 260×180 image-led cards, gradient scrim bottom third, title + suburb + "from $X" overlaid in white, urgency chip ("3 days left") top-left when ≤ 3 days, item count top-right. Snap scrolling (`snapToInterval`), peek of next card.
3. **Item feed → 2-column grid.** Replace the monotonous full-width rows with a 2-col grid (`FlatList numColumns={2}`): square `ItemImage`, name (2 lines), brand caption, `PriceText`, heart overlay top-right for save-from-feed. Furniture is a visual purchase — the 76px-thumb row layout wastes the product photo.
4. **Section headers**: `micro` eyebrow + `heading`, e.g. "LIVE NOW / Moving sales" — replace "Everything on the belt" (conveyor-belt metaphor reads as confusing copy on mobile; A/B-able, but default to "Fresh finds").
5. **Loading**: skeleton hero row + skeleton grid (no full-screen spinner). **Refresh**: pull-to-refresh (missing today). **Pagination**: `onEndReached` if/when backend pages.
6. Item card tap → **item detail** (today it routes to the sale, losing the tapped item — wrong target).

**Exit:** market screen is image-led, searchable, filterable, skeleton-loaded.

---

## Phase P4 — Sale & item detail (conversion screens)

`app/sale/[eventId].tsx`:

- **Edge-to-edge cover** (h 280) with back/heart as floating circular buttons over the image (transparent header that solidifies on scroll — reanimated interpolation). Drop the duplicated title (currently in header AND body).
- Seller row: `Avatar` + @username + "View profile" affordance (even if it links nowhere yet) instead of the plain "Sold by @x" string.
- Meta chips via `Chip`; urgency chip uses `urgent` variant when ≤3 days.
- Bundles: keep accordion but animate expand (`LayoutAnimation`/reanimated), bundle savings callout when `bundlePrice < itemTotal` ("Save $80 bundling"), item rows 64px thumbs, chevron affordance.
- **Sticky bottom bar** (safe-area aware): total range + "Message seller" primary button — visible without scrolling to the end.

`app/item/[eventId]/[bundleId]/[itemId].tsx`:

- Gallery: paginated `expo-image` pages with dot indicator, pinch/lightbox kept; image area 4:3 (taller than today).
- Title block: name (`title`), brand+condition caption, then price row: `PriceText` 28pt + original price struck-through + "−46%" save chip (data already in metadata).
- Spec table: keep, but label `micro` caps / value `body`, no hairline between every row (group spacing instead).
- "From the sale" plain-text block → tappable `Card` (cover thumb + sale title + suburb + chevron) linking to the sale.
- **Sticky CTA bar**: `Message seller` (primary) + `Make offer` (secondary, opens the offer sheet that already exists in conversation) + heart. Today the CTA scrolls off-screen below the fold.
- Below CTA: "More from this sale" horizontal rail (reuse grid card) — data already in the sale payload.

**Exit:** both detail screens have sticky CTAs, image-led layouts, and zero duplicated headers.

---

## Phase P5 — Messages & conversation

`app/(tabs)/messages.tsx`: rows via `Avatar` + `Chip(deal)`; unread = clay dot on avatar + bold preview (current bg-tint approach is invisible on cream); swap `FlatList onRefresh` for `RefreshControl` with clay tint; skeleton rows.

`app/conversation/[convId].tsx` (split `components/messages/*` — file is the largest in the app):

- Pinned item context card at top (thumb + name + price + status chip) — tappable to the item; today context is only "Re:" text in the list.
- Bubbles: mine = clay-600/white, theirs = surface-container-high/ink, 18 radius with tail-corner 4; day separators (`micro` centered); timestamps on tap, not always-on.
- `OfferCard` restyle: amount in `display` size, status chip semantic variants, Accept (primary) / Counter (secondary) side-by-side, accepted state = celebratory tertiary-green card + confetti-light haptic `notificationAsync(Success)`.
- Deal-agreed banner + phone-reveal as a distinct full-width tertiary card.
- Input bar: rounded field + circular send button (disabled until text), `+ Offer` affordance left of input, KeyboardAvoiding verified on both platforms.

**Exit:** chat reads like a marketplace negotiation surface, not a debug log.

---

## Phase P6 — Seller flows

`app/(tabs)/sell.tsx`: header CTA via `Button(md)`; sale cards get cover thumbnail (data has `cover_image_url`), status `Chip`, itemCount + value as icon-caption pair, "Created…" relative date; processing states show an indeterminate progress bar on-card.

`app/capture/index.tsx`: this is the marquee flow — make the HUD feel like a product:

- Full-bleed camera, safe-area floating controls: close (top-left), torch (top-right), big 72pt shutter with capture-in-flight progress ring, thumbnail stack of captured items bottom-left (tap → review), running count + est. value chip bottom-center ("4 items · ~$1,240").
- Identify result: replace the blocking `Modal`+`Alert` with a **bottom sheet** (name editable inline, AI price, Confirm / Retake) so the camera never disappears; success = light haptic + thumbnail flies into the stack (reanimated).
- Permission gate: branded explainer screen (illustration, "Myrio uses your camera to identify and price your items in seconds", Allow button) instead of bare OS prompt.

`app/capture/review.tsx`: cards with photo 88px, inline name edit kept, swipe-to-delete (gesture-handler) with undo snackbar, sticky "List N items →" primary button, total est. value in header.

**Exit:** capture demoable in an app-store screenshot.

---

## Phase P7 — Profile, auth, system screens

- `profile.tsx`: avatar block (photo or `Avatar`), display name `title`, member-since caption; stats row (active sales · items sold · saved); grouped menu cards (Buying: Saved/Purchases/Notifications; Selling: My Sales; Account: settings rows that exist on web — link or stub); Sign out ghost-destructive at bottom. Remove the redundant "Go to My Sales" hero card (Sell tab exists).
- `(auth)/login.tsx` + `register.tsx`: Fraunces wordmark large, warm welcome line, fields with focus ring (clay border), proper Google logo asset (not a blue letter "G" text), terms microcopy on register, error banner via semantic `error` styling.
- `notifications.tsx` / `purchases.tsx`: `ScreenHeader(back)` + `EmptyState`; notification rows: type icon in tinted circle (message/offer/deal variants), unread dot, relative time; purchases reuse conversation-summary card.
- `+not-found.tsx`: branded 404 with "Back to market" Button.

---

## Phase P8 — Motion, haptics, a11y, final polish

- **Motion vocabulary** (single `lib/motion.ts`): press scale 0.97 spring; list item entrance fade+4px rise, 30ms stagger, first load only; accordion/sheet spring; screen transitions stay `slide_from_right`.
- **Haptics map**: selection → tab/chip/toggle; impact-light → capture shutter, save heart; notification-success → offer accepted, sale published; notification-error → failures.
- **A11y sweep**: `accessibilityRole`/`Label` on every interactive; min 44pt targets (back buttons currently 22px icon + 4px padding = ~30pt); bump `#A09683`-on-cream body text to ink-400+ where < 4.5:1; `accessibilityElementsHidden` on decorative shimmer.
- **Empty/error/offline states**: every query screen gets `EmptyState` for error ("Couldn't load — Retry" with button, replacing dead-end "Check your connection" text) and a NetInfo offline banner.
- **App icon + splash**: verify `app.json` assets match Myrio brand (currently default Expo placeholder risk).

---

## Execution notes

- **Order matters:** P0 bugs → P1 kit → P2..P7 can interleave, P8 last. Every phase after P1 *must* consume the kit — no new inline hex.
- **Each phase exit:** `pnpm type-check` green + walkthrough screenshots at 390px (the iframe-shim trick in this audit works: serve Expo web, wrap in a 390px iframe — note `Page.captureScreenshot` stalls while RN-web animations run; retry after settle).
- **Native verify** on Expo Go / dev build for: safe areas, haptics, camera HUD, keyboard avoidance — web preview lies about all four.
- **Out of scope here:** push, OTA, store listing (covered in `MOBILE_NATIVE_ULTRAPLAN.md`); backend search endpoint (P3 ships client-side filter first).
