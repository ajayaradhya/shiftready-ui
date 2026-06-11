# Myrio Native Mobile (iOS + Android) UltraPlan

Drafted 2026-06-03. Supersedes the Appendix stub in the Web Production-Hardening plan.

**Goal:** Ship native iOS + Android apps that reuse the existing FastAPI backend and ~85% of the web app's TypeScript logic, without forking business logic or breaking the live web product.

**Why now:** Web is ~98% prod-ready. Backend feature surface is mature and stable (sales / marketplace / messages / notifications / sold / users, all wired in `src/lib/api.ts`). The remaining differentiator — live camera capture — is a fundamentally better experience as a native app (camera access, haptics, push, offline resilience, app-store discovery).

---

## Decided Stack (confirmed)

| Concern | Choice | Reason |
|---------|--------|--------|
| Monorepo | **Turborepo + pnpm workspaces** | Keep `apps/web` (current Next.js, unchanged URLs/deploy) + add `apps/mobile`; share `packages/*` |
| Mobile framework | **Expo (SDK 54+) + Expo Router** | File-based routing mirrors Next App Router; EAS Build/Submit/Update; OTA updates; managed native modules. RN New Architecture on. |
| Styling | **NativeWind v4** | Tailwind v4 token parity with web `@theme`; reuse the cream/clay design tokens |
| Data layer | **TanStack Query v5** (already used) | Hooks port almost verbatim; only the fetch transport + storage differ |
| Auth | **Firebase JS SDK 12** (already used) with RN persistence (`getReactNativePersistence` + AsyncStorage) | Same `dev_*` bypass story for local; same ID-token Bearer flow |
| Forms/validation | **react-hook-form + zod** (already used) | Direct port |
| Camera | **expo-camera** (+ `expo-image-manipulator` for JPEG resize) | Replaces browser `getUserMedia`; tap-first identify flow maps 1:1 to `POST /capture/frame` |
| Push | **expo-notifications** + FCM/APNs | New backend surface (device-token register + send) |
| WebSocket | native `WebSocket` (RN built-in) | `use-*-ws` hooks port; token in `?token=` query (already the contract) |
| Distribution | **EAS Build + Submit + Update** | Apple $99/yr, Play $25 one-time, EAS free <1k MAU then ~$19/mo |

**Sharing target:** API client, types, zod schemas, formatters, constants, and all non-DOM TanStack hooks → `packages/`. UI is per-platform (RN primitives vs DOM). Realistic logic reuse ~80-85%; pure-UI components are NOT shared.

---

## Repo Restructure (one-time, reversible)

Current `shiftready-ui/` is a single Next.js app. Convert to a Turborepo:

```
shiftready-ui/                 (repo root becomes the monorepo)
├─ apps/
│  ├─ web/                     ← move current Next.js app here verbatim
│  └─ mobile/                  ← new Expo Router app
├─ packages/
│  ├─ api/                     ← apiRequest<T> wrapper + all endpoint fns (from src/lib/api.ts)
│  ├─ types/                   ← src/lib/types.ts + schemas.ts (zod)
│  ├─ core/                    ← format.ts, constants.ts, locations.ts, marketplace-filters.ts
│  ├─ hooks/                   ← platform-agnostic TanStack hooks (use-sales, use-messages, …)
│  └─ config/                  ← shared tsconfig, eslint, prettier, tailwind tokens
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json                (workspace root)
```

**Risk control:** `apps/web` deploy (`cloudbuild.yaml`, Dockerfile) must keep working. Update build context paths only; do NOT change the deployed image's runtime. CI gate: web build + e2e still green before merging the restructure.

**Backend untouched** by the restructure. Only new mobile-specific endpoints (push tokens) are additive.

---

## What blocks sharing (must abstract)

| Web-coupled thing | Abstraction |
|-------------------|-------------|
| `localStorage` / token cache | `packages/api` takes a `TokenStore` interface; web uses memory+localStorage, mobile uses AsyncStorage/SecureStore |
| `firebase.ts` web init | Split: shared auth logic in `packages`, platform init (web vs RN persistence) injected |
| `fetch` base URL / `next/*` imports | API package must be free of `next/*`; pass `baseUrl` in |
| Browser `getUserMedia` capture | Mobile reimplements capture UI with `expo-camera`; the `/capture/*` API calls are shared |
| `next/image`, DOM components | Not shared; rebuilt with RN `Image`/`expo-image` |

---

## Backend Work (additive, small)

1. **Push tokens.** New `users/{uid}` field `pushTokens[]` (device tokens). Endpoints: `POST /users/me/push-token` (register), `DELETE /users/me/push-token`. New repo method on `user_repo`.
2. **Push send.** Extend `notifier.py` (or new `push.py` service): on the same events that emit WS notifications (new message, offer, sold, pipeline done), also fan-out via Expo Push API / FCM. Reuse existing notification-creation call sites — do NOT duplicate event logic.
3. **CORS / no change** for REST — native app sends Bearer like web.
4. **App version gate (optional, P5):** `GET /app/min-version` for forced-update.

Everything else (auth, signed GCS URLs, capture pipeline, marketplace masking) already works for a Bearer client.

---

## Phasing

### Phase 0 — Monorepo foundation ✅ DONE (2026-06-04)
- [x] Turborepo + pnpm workspace scaffold; move web into `apps/web` (no behavior change).
- [x] Extract `packages/{types,core,api}`; web imports from packages; web build + e2e green.
- [x] Shared tsconfig/eslint/prettier/tailwind-token config package.
- **Exit:** web runs and deploys exactly as before, now sourcing logic from `packages/`.

### Phase 1 — Expo app shell + auth ✅ DONE (2026-06-04; Google SSO added 2026-06-05)
- [x] `apps/mobile` Expo Router app; NativeWind v4 with cream/clay tokens.
- [x] Firebase Auth (RN persistence via `initializeAuth` + `getReactNativePersistence(AsyncStorage)`). Login / register / logout. `dev_*` local bypass parity.
- [x] Bottom-tab navigation: Market / Saved / Messages / Profile + seller entry stub.
- [x] Wire `packages/api` via `configure({ apiBaseUrl })` at root layout; `getMe()` called in Profile tab.
- [x] **Google SSO** — `expo-auth-session/providers/google` + `Google.useIdTokenAuthRequest` in `AuthProvider`; response `id_token` → `signInWithCredential(GoogleAuthProvider.credential(...))`; "Continue with Google" button on login + register screens. Requires three env vars (see below).
- **Exit:** logged-in user lands on a tabbed shell hitting the real backend. Email/password and Google SSO both work.
- **Key files:**
  - `apps/mobile/` — Expo Router app root
  - `apps/mobile/lib/firebase.ts` — RN Firebase init with AsyncStorage persistence
  - `apps/mobile/contexts/auth-context.tsx` — `signInWithGoogle` via `useIdTokenAuthRequest`; `WebBrowser.maybeCompleteAuthSession()` at module level
  - `apps/mobile/app/_layout.tsx` — root layout: QueryClient + AuthProvider + `configure()`
  - `packages/api/src/index.ts` — added `configure({ apiBaseUrl })` export; `_apiBase` is now mutable
- **Google SSO env vars** (add to `.env.local` and Firebase Console):
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — Google Cloud Console → Credentials → iOS OAuth client (bundle: `au.com.myrio.app`)
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — Google Cloud Console → Credentials → Android OAuth client (package: `au.com.myrio.app`)
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Firebase Console → Auth → Google → Web SDK configuration → Web client ID
- **Google SSO setup steps:**
  1. Firebase Console → Authentication → Sign-in method → enable Google.
  2. Google Cloud Console → Credentials → create iOS client (bundle `au.com.myrio.app`) + Android client (package + SHA-1 fingerprint from EAS / keytool).
  3. Add all three client IDs to `.env.local`. For development with Expo Go, only `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is required (native clients are used in EAS builds).

### Phase 2 — Buyer read-only ✅ DONE (2026-06-04)
- [x] Market browse — sale cards (horizontal) + item feed (vertical); `getLandingData()`.
- [x] Sale detail — cover image, meta chips (suburb/date/urgency), bundles + items list with sold/reserved badges; save/unsave.
- [x] Item detail — paginated image gallery, full-screen lightbox modal, detail table, context section, save/unsave.
- [x] Saved list — saved sales + saved items; unauthenticated empty state with login CTA.
- **Key files:**
  - `apps/mobile/app/(tabs)/index.tsx` — market browse (updated)
  - `apps/mobile/app/(tabs)/saved.tsx` — saved list (updated)
  - `apps/mobile/app/sale/[eventId].tsx` — sale detail (new)
  - `apps/mobile/app/item/[eventId]/[bundleId]/[itemId].tsx` — item detail + lightbox (new)
- **Exit:** a buyer can browse + view + save entirely on device.

### Phase 3 — Buyer interactive ✅ DONE (2026-06-05)
- [x] Messages tab: full conversation list with unread badges; WS live updates via `useMessagesWs`.
- [x] Thread screen (`/conversation/[convId]`): inverted FlatList, send text, offer card (accept/counter/withdraw), deal-agreed header chip, phone reveal banner.
- [x] Offer modal: cross-platform TextInput sheet (no Alert.prompt).
- [x] Notifications screen (`/notifications`): in-app feed, mark read / mark all read.
- [x] Purchases screen (`/purchases`): enquiry tracker sorted by deal status.
- [x] "Message seller" button in item detail; `startConversation` → navigate to thread.
- [x] Unread badge on Messages tab from `useUnreadCount` in tabs layout.
- [x] Profile links to Notifications (with unread count chip) and My Purchases.
- [x] All hooks ported: `use-conversations`, `use-messages`, `use-messages-ws`, `use-send-message`, `use-offers`, `use-notifications`.
- **Note:** expo-notifications push (device token → backend) deferred to Phase 4; backend push endpoint not yet built.
- **Exit:** full buyer loop (browse → message → offer → deal) on device with live WS.
- **Key files:**
  - `apps/mobile/hooks/` — 6 new hooks (use-conversations, use-messages, use-messages-ws, use-send-message, use-offers, use-notifications)
  - `apps/mobile/app/(tabs)/messages.tsx` — conversation list (full)
  - `apps/mobile/app/conversation/[convId].tsx` — thread + offer flow
  - `apps/mobile/app/notifications.tsx` — notification feed
  - `apps/mobile/app/purchases.tsx` — purchases/enquiry tracker

### Phase 4 — Seller + capture (the native payoff) ✅ DONE (2026-06-05, remaining items 2026-06-05)
- [x] **Sell tab** (5th tab, briefcase icon) — My Sales list with status badges, item count, total value, pull-to-refresh. New sale → capture.
- [x] **Inventory cockpit** (`/seller/inventory/[eventId]`) — SectionList of bundles/items; status action banner (publish CTA / live/unpublish / processing spinner); item edit bottom sheet (name, price, AI reprice, mark sold, delete); publish modal (move_out_date, suburb, pincode); archive.
- [x] **Live capture** (`/capture`) — `expo-camera` CameraView, tap-first shutter, `expo-image-manipulator` JPEG resize to 1200px, `POST /capture/frame` → Gemini identify, editable name in bottom sheet, thumbnail strip.
- [x] **Capture review** (`/capture/review`) — inline name edit, remove item, `POST /capture/finalize-v2` → navigate to inventory cockpit.
- [x] `captureFrameNative` added to `packages/api` (RN FormData URI format).
- [x] `lib/capture-store.ts` module-level store passes items capture→review without context bloat.
- [x] Profile "Seller Central" button wired → Sell tab.
- [x] Item photo upload from camera roll (`expo-image-picker` → signed PUT → `confirmItemImages`).
- [x] Haptics on shutter tap (`expo-haptics` ImpactFeedbackStyle.Medium).
- [x] Wake-lock during capture (`expo-keep-awake` activate/deactivate).
- [x] Bundle-level mark-sold from cockpit (bundle section header "Mark sold" button → `BundleSoldSheet`).
- **Key files:**
  - `apps/mobile/app/(tabs)/sell.tsx` — My Sales dashboard
  - `apps/mobile/app/seller/inventory/[eventId].tsx` — inventory cockpit
  - `apps/mobile/app/capture/index.tsx` — camera capture screen
  - `apps/mobile/app/capture/review.tsx` — review + finalize
  - `apps/mobile/lib/capture-store.ts` — ephemeral capture state
  - `packages/api/src/index.ts` — `captureFrameNative` added
- **Exit:** a seller can capture items, review/rename them, finalize, view inventory, edit prices, publish to marketplace, and mark items sold.

### Phase 5 — Store readiness + polish ✅ IN PROGRESS (2026-06-05)
- [x] **`eas.json`** — dev/preview/production build profiles + EAS Submit config (`apps/mobile/eas.json`).
- [x] **`app.json`** — EAS Update (`expo-updates`, OTA), splash/icon config, push notification plugin, iOS `associatedDomains`, Android `intentFilters` for universal/app links.
- [x] **`expo-notifications`** + **`expo-updates`** added to `package.json`.
- [x] **`@sentry/react-native`** added; Sentry init in root layout (disabled in dev, `EXPO_PUBLIC_SENTRY_DSN`).
- [x] **Push token registration** — `lib/push.ts`: `registerPushToken()` / `unregisterPushToken()`; called on auth state change in `auth-context.tsx`.
- [x] **OTA update check** — `lib/updates.ts`: `checkForOTAUpdate()` on app launch in root layout.
- [x] **Backend push token** — `POST /users/me/push-token` + `DELETE /users/me/push-token` (users router + user_repo `add/remove/get_push_tokens`).
- [x] **Push fan-out** — `app/services/push.py` (`PushService` via Expo Push API); wired into `MessagingService` for message.new / offer.new / offer.countered / offer.accepted events.
- [x] **Universal links** — `apps/web/public/.well-known/apple-app-site-association` + `assetlinks.json`; `next.config.js` serves both with `Content-Type: application/json`.
- [ ] **Fill-in steps** (manual, need accounts/assets):
  - Run `eas init` in `apps/mobile/` → replace `FILL_IN_EAS_PROJECT_ID` in `app.json` (two places).
  - Create app icon (`./assets/icon.png` 1024×1024) + splash (`./assets/splash.png`) + adaptive icon (`./assets/adaptive-icon.png` 1024×1024) + notification icon (`./assets/notification-icon.png` 96×96 white-on-transparent).
  - Fill `eas.json` submit block: `appleId`, `ascAppId`, `appleTeamId`, `google-play-service-account.json`.
  - Fill `apple-app-site-association`: replace `FILL_IN_APPLE_TEAM_ID`.
  - Fill `assetlinks.json`: replace SHA256 fingerprint (from `eas credentials` after first Android build).
  - Add `EXPO_PUBLIC_SENTRY_DSN` to `.env.local` (from Sentry project settings).
  - Run `pnpm --filter @myrio/mobile install` to pull `expo-notifications`, `expo-updates`, `@sentry/react-native`.
- [ ] App Store + Play Console: create app listings, store screenshots, privacy nutrition labels (camera, push, auth).
- [ ] Beta: EAS Build `preview` profile → TestFlight + Play internal testing; collect feedback; submit for review.
- **Exit:** approved on both stores.

---

## Costs / Accounts
- Apple Developer Program **$99/yr** (required to ship iOS).
- Google Play Console **$25 one-time**.
- EAS: free tier <1k MAU, then ~**$19/mo**.
- Firebase: existing project; add iOS + Android apps (config plists/json), enable FCM.

## Key Risks
- **Restructure regressions** on web deploy — gate behind green web build + e2e.
- **Camera parity** — `finalize-v2` already assumes pre-analyzed items; mobile must match the per-frame contract exactly (no re-extract).
- **Push infra** — new backend surface; smallest viable = Expo Push API before raw FCM/APNs.
- **Firebase RN persistence** gotcha — must use `getReactNativePersistence(AsyncStorage)` or auth state drops on reload.
- **App-store review** — camera + marketplace + payments-adjacent; ensure no in-app purchase rules tripped (deals are off-platform/phone reveal, not IAP).

## Sequence rationale
Buyer read-only first = exercises auth + api + types + design tokens with the least surface, proves the share story, ships something demoable fast. Capture last because it's the only truly new native code and benefits from a hardened shared layer underneath.
